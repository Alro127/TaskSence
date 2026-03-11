package dev.alro127.tasksense.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import dev.alro127.tasksense.config.provider.GoogleConfig;
import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.request.TokenRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.security.hash.TokenHasher;
import dev.alro127.tasksense.security.jwt.JwtTokenProvider;
import dev.alro127.tasksense.security.token.TokenProvider;
import dev.alro127.tasksense.service.AuthService;
import dev.alro127.tasksense.service.EmailService;

import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Collections;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate stringRedisTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final GoogleConfig googleConfig;
    private final TokenProvider tokenProvider;
    private final TokenHasher tokenHasher;
    private final EmailService emailService;

    private String generateAndStoreRefreshToken(UserEntity user) {
        String refreshToken = tokenProvider.generate();

        String hashedToken = tokenHasher.hash(refreshToken);

        stringRedisTemplate.opsForValue().set(
                RedisKeys.refreshToken(hashedToken),
                user.getId().toString(),
                Duration.ofDays(7));

        return refreshToken;
    }

    @Override
    @Transactional
    public void register(AuthRequest request) {
        var user = UserEntity.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(false)
                .build();

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        userRepository.save(user);

        sendOtp(user.getEmail());
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = jwtTokenProvider.generateAccessToken(authentication.getName());

            UserEntity user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            String refreshToken = generateAndStoreRefreshToken(user);

            return new AuthResponse(accessToken, refreshToken);

        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Override
    public AuthResponse refresh(TokenRequest request) {

        String hashedToken = tokenHasher.hash(request.getToken());

        String userId = stringRedisTemplate.opsForValue().get(RedisKeys.refreshToken(hashedToken));

        if (userId == null) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        UserEntity user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(request.getToken())
                .build();
    }

    @Override
    @Transactional
    public void sendOtp(String email) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String otp = String.valueOf(100000 + new SecureRandom().nextInt(900000));

        stringRedisTemplate.opsForValue().set(
                "OTP:" + email,
                otp,
                Duration.ofMinutes(5));

        emailService.sendVerifyEmail(email, otp);
    }

    @Override
    public AuthResponse verifyOtp(String email, String otp) {

        String savedOtp = stringRedisTemplate.opsForValue().get(RedisKeys.otp(email));

        if (savedOtp == null) {
            throw new UnauthorizedException("OTP expired or not found");
        }

        if (!savedOtp.equals(otp)) {
            throw new UnauthorizedException("Invalid OTP");
        }

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsActive(true);
        userRepository.save(user);

        redisTemplate.delete("OTP:" + email);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = generateAndStoreRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken);
    }

    @Transactional
    @Override
    public void forgotPassword(String email) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String rawToken = tokenProvider.generate();
        String hashedToken = tokenHasher.hash(rawToken);

        stringRedisTemplate.opsForValue().set(
                RedisKeys.resetToken(hashedToken),
                user.getId().toString(),
                Duration.ofMinutes(5));

        emailService.sendResetPasswordEmail(email, rawToken);
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = tokenHasher.hash(rawToken);

        String redisKey = RedisKeys.refreshToken(hashedToken);

        String userIdStr = stringRedisTemplate.opsForValue().get(redisKey);

        if (userIdStr == null) {
            throw new BadRequestException("Invalid or expired token");
        }

        Long userId = Long.valueOf(userIdStr);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        redisTemplate.delete(redisKey);
    }

    @Override
    public AuthResponse loginWithGoogle(String code) {
        GoogleIdToken.Payload payload = null;
        try {
            payload = getGoogleUserProfile(code);
        } catch (Exception ex) {
            throw new UnauthorizedException(ex.getMessage());
        }
        var email = payload.getEmail();

        AtomicReference<AuthResponse> authResponse = new AtomicReference<>();

        GoogleIdToken.Payload finalPayload = payload;
        userRepository.findByEmail(email).ifPresentOrElse(account -> {
            String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail());
            String refreshToken = generateAndStoreRefreshToken(account);

            authResponse.set(new AuthResponse(accessToken, refreshToken));
        }, () -> {
            String fullName = (String) finalPayload.get("name");
            String picture = (String) finalPayload.get("picture");
            var accountEntity = UserEntity.builder()
                    .email(email)
                    .password("")
                    .fullName(fullName)
                    .avatarUrl(picture)
                    .build();
            var account = userRepository.save(accountEntity);
            String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail());
            String refreshToken = generateAndStoreRefreshToken(account);

            authResponse.set(new AuthResponse(accessToken, refreshToken));
        });

        return authResponse.get();
    }

    private GoogleIdToken.Payload getGoogleUserProfile(String code) throws Exception {
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                "https://oauth2.googleapis.com/token",
                googleConfig.getClientId(),
                googleConfig.getClientSecret(),
                code,
                googleConfig.getRedirectUri()).execute();

        String idTokenString = tokenResponse.getIdToken();

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleConfig.getClientId()))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);

        if (idToken == null) {
            throw new RuntimeException("Invalid ID token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new RuntimeException("Email not verified");
        }

        return payload;
    }

    @Override
    public void logout(TokenRequest tokenRequest) {

        String hashedToken = tokenHasher.hash(tokenRequest.getToken());

        Boolean deleted = stringRedisTemplate.delete(RedisKeys.refreshToken(hashedToken));

        if (Boolean.FALSE.equals(deleted)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
    }
}
