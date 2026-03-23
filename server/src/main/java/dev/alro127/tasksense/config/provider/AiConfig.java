package dev.alro127.tasksense.config.provider;

import dev.alro127.tasksense.service.GeminiEmbeddingModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@Slf4j
public class AiConfig {

    @Value("${spring.ai.google.genai.api-key:}")
    private String apiKey;

    @Bean
    @ConditionalOnMissingBean(EmbeddingModel.class)
    public EmbeddingModel embeddingModel() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY not set — EmbeddingModel will not be created. RAG search disabled.");
            return null;
        }
        log.info("Creating GeminiEmbeddingModel via Gemini REST API (text-embedding-004).");
        return new GeminiEmbeddingModel(apiKey, RestClient.builder().build());
    }
}
