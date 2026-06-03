package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.dto.response.HealthResponse;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthServiceImplTest {

    @Test
    void getHealthReturnsSafeStatusAndRecordsMetrics() {
        ApplicationAvailability availability = mock(ApplicationAvailability.class);
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        when(availability.getLivenessState()).thenReturn(LivenessState.CORRECT);
        when(availability.getReadinessState()).thenReturn(ReadinessState.ACCEPTING_TRAFFIC);

        HealthServiceImpl service = new HealthServiceImpl(
                availability,
                meterRegistry,
                "TaskSense");

        HealthResponse response = service.getHealth();

        assertThat(response.getStatus()).isEqualTo("UP");
        assertThat(response.getApplication()).isEqualTo("TaskSense");
        assertThat(response.getLiveness()).isEqualTo("CORRECT");
        assertThat(response.getReadiness()).isEqualTo("ACCEPTING_TRAFFIC");
        assertThat(response.getDetails()).containsEntry("prometheus", "/actuator/prometheus");
        assertThat(meterRegistry.counter("tasksense_health_requests_total").count()).isEqualTo(1.0);
        assertThat(meterRegistry.timer("tasksense_health_request_duration").count()).isEqualTo(1L);
    }

    @Test
    void getHealthReturnsDownWhenReadinessRefusesTraffic() {
        ApplicationAvailability availability = mock(ApplicationAvailability.class);
        SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
        when(availability.getLivenessState()).thenReturn(LivenessState.CORRECT);
        when(availability.getReadinessState()).thenReturn(ReadinessState.REFUSING_TRAFFIC);

        HealthServiceImpl service = new HealthServiceImpl(availability, meterRegistry, "TaskSense");

        HealthResponse response = service.getHealth();

        assertThat(response.getStatus()).isEqualTo("DOWN");
    }
}
