package dev.alro127.tasksense.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.security.hash.TokenHasher;
import dev.alro127.tasksense.security.token.TokenProvider;
import dev.alro127.tasksense.service.AgentConfirmationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgentConfirmationServiceImpl implements AgentConfirmationService {

    private static final Duration CONFIRMATION_TTL = Duration.ofMinutes(3);

    private final TokenProvider tokenProvider;
    private final TokenHasher tokenHasher;
    private final StringRedisTemplate stringRedisTemplate;
    private final SecurityService securityService;
    private final ObjectMapper objectMapper;

    @Override
    public ConfirmationTicket issue(String action, Object target, Object proposedChanges) {
        String token = tokenProvider.generate();
        String tokenHash = tokenHasher.hash(token);
        String payload = payload(action, target, proposedChanges);
        stringRedisTemplate.opsForValue().set(
                RedisKeys.agentConfirmationToken(tokenHash),
                payload,
                CONFIRMATION_TTL);
        return new ConfirmationTicket(token, OffsetDateTime.now().plus(CONFIRMATION_TTL), tokenHasher.hash(payload));
    }

    @Override
    public void consume(String confirmationToken, String action, Object target, Object proposedChanges) {
        if (confirmationToken == null || confirmationToken.isBlank()) {
            throw new UnauthorizedException("Invalid or expired confirmation token");
        }
        String tokenHash = tokenHasher.hash(confirmationToken.trim());
        String key = RedisKeys.agentConfirmationToken(tokenHash);
        String storedPayload = stringRedisTemplate.opsForValue().getAndDelete(key);
        if (storedPayload == null) {
            throw new UnauthorizedException("Invalid or expired confirmation token");
        }
        String expectedPayload = payload(action, target, proposedChanges);
        if (!storedPayload.equals(expectedPayload)) {
            throw new UnauthorizedException("Invalid or expired confirmation token");
        }
    }

    private String payload(String action, Object target, Object proposedChanges) {
        Map<String, Object> value = Map.of(
                "userId", securityService.getCurrentUserId(),
                "action", action,
                "target", target != null ? target : Map.of(),
                "proposedChanges", proposedChanges != null ? proposedChanges : Map.of());
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to create confirmation payload", e);
        }
    }
}
