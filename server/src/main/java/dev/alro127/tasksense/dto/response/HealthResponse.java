package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
public class HealthResponse {
    private String status;
    private String application;
    private String liveness;
    private String readiness;
    private OffsetDateTime timestamp;
    private Map<String, String> details;
}
