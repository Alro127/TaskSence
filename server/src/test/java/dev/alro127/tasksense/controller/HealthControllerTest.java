package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.response.HealthResponse;
import dev.alro127.tasksense.service.HealthService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.time.OffsetDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTest {

    @Test
    void getHealthWrapsServiceResponseInApiResponse() {
        HealthService healthService = mock(HealthService.class);
        HealthResponse health = HealthResponse.builder()
                .status("UP")
                .application("TaskSense")
                .liveness("CORRECT")
                .readiness("ACCEPTING_TRAFFIC")
                .timestamp(OffsetDateTime.now())
                .details(Map.of("prometheus", "/actuator/prometheus"))
                .build();
        when(healthService.getHealth()).thenReturn(health);

        ResponseEntity<ApiResponse<HealthResponse>> response = new HealthController(healthService).getHealth();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo("200");
        assertThat(response.getBody().getData()).isSameAs(health);
        assertThat(response.getBody().getErrors()).isNull();
    }
}
