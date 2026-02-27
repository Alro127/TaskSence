package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;
import dev.alro127.tasksense.entity.UserEntity;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.security.jwt.JwtTokenProvider;
import dev.alro127.tasksense.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    public void register(AuthRequest request) {
        var user = UserEntity.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(false)
                .build();

        userRepository.save(user);

        sendOtp(user.getEmail());
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = jwtTokenProvider.generateAccessToken(authentication.getName());
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication.getName());

        return new AuthResponse(accessToken, refreshToken);
    }

    @Override
    public void sendOtp(String email) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        redisTemplate.opsForValue().set(
                "OTP:" + email,
                otp,
                Duration.ofMinutes(5)
        );

        EmailMessage message = new EmailMessage(
                email,
                "Your OTP Code",
                "Your OTP is: " + otp
        );

        redisTemplate.convertAndSend("otp-email-channel", message);
    }

    @Override
    public AuthResponse verifyOtp(String email, String otp) {

        String savedOtp = Objects.requireNonNull(redisTemplate.opsForValue().get("OTP:" + email)).toString();

        if (savedOtp == null) {
            throw new UnauthorizedException("OTP expired or not found");
        }

        if (!savedOtp.equals(otp)) {
            throw new UnauthorizedException("Invalid OTP");
        }

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        user.setIsActive(true);
        userRepository.save(user);

        redisTemplate.delete("OTP:" + email);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, refreshToken);
    }
}
