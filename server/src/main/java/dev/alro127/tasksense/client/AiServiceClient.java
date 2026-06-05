package dev.alro127.tasksense.client;

import dev.alro127.tasksense.dto.guidance.GuidanceGenerationContextDto;
import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import dev.alro127.tasksense.exception.BadRequestException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${tasksense.ai-service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public WorkflowGuidanceDto generateGuidance(GuidanceGenerationContextDto context, String authToken) {
        String url = aiServiceUrl + "/api/v1/guidance/generate";

        HttpHeaders headers = new HttpHeaders();
        if (authToken != null && !authToken.isBlank()) {

            String token = authToken;
            if (token.toLowerCase().startsWith("bearer ")) {
                token = token.substring(7).trim();
            }
            headers.setBearerAuth(token);
            log.info("Sending request to AI Service with token (prefix: {})",
                    token.substring(0, Math.min(token.length(), 10)) + "...");
        } else {
            log.warn("Auth token is missing in AiServiceClient!");
        }
        HttpEntity<GuidanceGenerationContextDto> request = new HttpEntity<>(context, headers);

        try {
            ResponseEntity<AiServiceResponse<WorkflowGuidanceDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<AiServiceResponse<WorkflowGuidanceDto>>() {
                    });

            AiServiceResponse<WorkflowGuidanceDto> body = response.getBody();
            if (body == null || !"SUCCESS".equals(body.getCode())) {
                String errorMsg = body != null && body.getErrors() != null ? String.join(", ", body.getErrors())
                        : "Unknown error";
                log.error("AI service generation failed: {}", errorMsg);
                throw new BadRequestException("AI service failed to generate guidance: " + errorMsg);
            }

            return body.getData();
        } catch (Exception e) {
            log.error("Error calling AI service for guidance generation", e);
            throw new BadRequestException("Failed to communicate with AI service: " + e.getMessage());
        }
    }

    @Data
    public static class AiServiceResponse<T> {
        private String code;
        private String message;
        private T data;
        private List<String> errors;
    }
}
