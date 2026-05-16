package dev.alro127.tasksense.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.security.hash.TokenHasher;
import dev.alro127.tasksense.security.token.TokenProvider;
import dev.alro127.tasksense.service.AgentConfirmationService;
import dev.alro127.tasksense.service.SecurityService;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

class AgentConfirmationServiceImplTest {

    @Test
    void issueStoresHashedTokenWithTtlAndConsumeDeletesItOnce() {
        TokenProvider tokenProvider = mock(TokenProvider.class);
        TokenHasher tokenHasher = new TokenHasher();
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        SecurityService securityService = mock(SecurityService.class);
        when(tokenProvider.generate()).thenReturn("raw-token");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(securityService.getCurrentUserId()).thenReturn(7L);

        AgentConfirmationServiceImpl service = new AgentConfirmationServiceImpl(
                tokenProvider,
                tokenHasher,
                redisTemplate,
                securityService,
                new ObjectMapper());

        AgentConfirmationService.ConfirmationTicket ticket = service.issue(
                "delete_task_natural",
                Map.of("taskId", 3),
                null);

        assertThat(ticket.token()).isEqualTo("raw-token");
        verify(valueOperations).set(
                eq("agent:confirmation:" + tokenHasher.hash("raw-token")),
                any(String.class),
                eq(Duration.ofMinutes(3)));

        ArgumentCaptor<String> payloadCaptor = forClass(String.class);
        verify(valueOperations).set(
                eq("agent:confirmation:" + tokenHasher.hash("raw-token")),
                payloadCaptor.capture(),
                eq(Duration.ofMinutes(3)));

        String payload = payloadCaptor.getValue();
        when(valueOperations.getAndDelete("agent:confirmation:" + tokenHasher.hash("raw-token")))
                .thenReturn(payload)
                .thenReturn(null);

        service.consume("raw-token", "delete_task_natural", Map.of("taskId", 3), null);
        assertThatThrownBy(() -> service.consume("raw-token", "delete_task_natural", Map.of("taskId", 3), null))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void consumeRejectsChangedActionOrPayload() {
        TokenProvider tokenProvider = mock(TokenProvider.class);
        TokenHasher tokenHasher = new TokenHasher();
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        SecurityService securityService = mock(SecurityService.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(tokenProvider.generate()).thenReturn("raw-token");
        when(securityService.getCurrentUserId()).thenReturn(7L);

        AgentConfirmationServiceImpl service = new AgentConfirmationServiceImpl(
                tokenProvider,
                tokenHasher,
                redisTemplate,
                securityService,
                new ObjectMapper());

        service.issue("delete_task_natural", Map.of("taskId", 3), null);
        ArgumentCaptor<String> payloadCaptor = forClass(String.class);
        verify(valueOperations).set(
                eq("agent:confirmation:" + tokenHasher.hash("raw-token")),
                payloadCaptor.capture(),
                eq(Duration.ofMinutes(3)));
        String payload = payloadCaptor.getValue();
        when(valueOperations.getAndDelete("agent:confirmation:" + tokenHasher.hash("raw-token"))).thenReturn(payload);

        assertThatThrownBy(() -> service.consume("raw-token", "delete_task_natural", Map.of("taskId", 4), null))
                .isInstanceOf(UnauthorizedException.class);
    }

}
