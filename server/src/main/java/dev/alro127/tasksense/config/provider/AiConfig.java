package dev.alro127.tasksense.config.provider;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import dev.alro127.tasksense.service.GeminiEmbeddingModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
@AllArgsConstructor
@EnableConfigurationProperties(AiConfig.GeminiProperties.class)
public class AiConfig {

    private GeminiProperties geminiProperties;

    /**
     * Override Spring AI's default Client bean (which uses v1beta) to use v1 instead.
     * gemini-2.5-flash and text-embedding-004 require v1.
     * Only created when GEMINI_API_KEY is set (non-blank).
     */
    @Bean
    public Client googleGenAiClient() {
        log.info("Creating Google GenAI Client with API version v1.");
        return Client.builder()
                .apiKey(geminiProperties.getApiKey())
                .httpOptions(HttpOptions.builder().apiVersion("v1").build())
                .build();
    }

    @Bean
    @ConditionalOnMissingBean(EmbeddingModel.class)
    public EmbeddingModel embeddingModel() {
        log.info("Creating GeminiEmbeddingModel with dedicated v1beta client for embedding-001.");
        return new GeminiEmbeddingModel(geminiProperties.getApiKey());
    }

    @Data
    @ConfigurationProperties(prefix = "spring.ai.google.genai")
    public static class GeminiProperties {
        private String apiKey;
    }

}
