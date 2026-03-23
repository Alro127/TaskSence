package dev.alro127.tasksense.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResponseMetadata;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Custom EmbeddingModel gọi Gemini text-embedding-004 API trực tiếp.
 * Spring AI 2.0.0-M3 chưa tích hợp embedding cho Google GenAI starter.
 */
@Slf4j
public class GeminiEmbeddingModel implements EmbeddingModel {

    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent";

    private final String apiKey;
    private final RestClient restClient;

    public GeminiEmbeddingModel(String apiKey, RestClient restClient) {
        this.apiKey = apiKey;
        this.restClient = restClient;
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        for (int i = 0; i < request.getInstructions().size(); i++) {
            String text = request.getInstructions().get(i);
            float[] vector = embedText(text);
            embeddings.add(new Embedding(vector, i));
        }
        return new EmbeddingResponse(embeddings, new EmbeddingResponseMetadata());
    }

    @Override
    public float[] embed(Document document) {
        return embedText(document.getText());
    }

    @Override
    public float[] embed(String text) {
        return embedText(text);
    }

    @Override
    public int dimensions() {
        return 768; // text-embedding-004 produces 768-dimensional vectors
    }

    @SuppressWarnings("unchecked")
    private float[] embedText(String text) {
        try {
            Map<String, Object> body = Map.of(
                    "content", Map.of(
                            "parts", List.of(Map.of("text", text))
                    )
            );

            Map<String, Object> response = restClient.post()
                    .uri(BASE_URL + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return new float[0];

            Map<String, Object> embedding = (Map<String, Object>) response.get("embedding");
            if (embedding == null) return new float[0];

            List<Number> values = (List<Number>) embedding.get("values");
            if (values == null) return new float[0];

            float[] result = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                result[i] = values.get(i).floatValue();
            }
            return result;

        } catch (Exception e) {
            log.warn("Gemini embedding API call failed: {}", e.getMessage());
            return new float[0];
        }
    }
}
