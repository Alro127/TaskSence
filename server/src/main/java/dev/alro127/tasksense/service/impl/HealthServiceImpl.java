package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.dto.response.HealthResponse;
import dev.alro127.tasksense.service.HealthService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
public class HealthServiceImpl implements HealthService {

    private final ApplicationAvailability availability;
    private final String applicationName;
    private final Counter healthRequests;
    private final Timer healthLatency;

    public HealthServiceImpl(
            ApplicationAvailability availability,
            MeterRegistry meterRegistry,
            @Value("${spring.application.name:tasksense}") String applicationName) {
        this.availability = availability;
        this.applicationName = applicationName;
        this.healthRequests = Counter.builder("tasksense_health_requests_total")
                .description("Total custom health API requests")
                .register(meterRegistry);
        this.healthLatency = Timer.builder("tasksense_health_request_duration")
                .description("Custom health API request duration")
                .register(meterRegistry);
    }

    @Override
    public HealthResponse getHealth() {
        healthRequests.increment();
        return healthLatency.record(this::buildHealthResponse);
    }

    private HealthResponse buildHealthResponse() {
        LivenessState liveness = availability.getLivenessState();
        ReadinessState readiness = availability.getReadinessState();
        return HealthResponse.builder()
                .status(resolveStatus(liveness, readiness))
                .application(applicationName)
                .liveness(liveness.toString())
                .readiness(readiness.toString())
                .timestamp(OffsetDateTime.now())
                .details(Map.of("actuator", "/actuator/health", "prometheus", "/actuator/prometheus"))
                .build();
    }

    private String resolveStatus(LivenessState liveness, ReadinessState readiness) {
        if (liveness == LivenessState.BROKEN || readiness == ReadinessState.REFUSING_TRAFFIC) {
            return "DOWN";
        }
        return "UP";
    }
}
