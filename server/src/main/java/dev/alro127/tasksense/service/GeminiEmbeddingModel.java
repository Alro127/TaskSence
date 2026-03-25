package dev.alro127.tasksense.service;

import com.google.genai.Client;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.EmbedContentConfig;
import com.google.genai.types.EmbedContentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResponseMetadata;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom EmbeddingModel using a dedicated v1beta google-genai Client.
 * embedding-001 requires v1beta; the SDK defaults to v1beta when no apiVersion is set.
 * This uses a separate Client from the v1 Client used by the chat model.
 */
@Slf4j
public class GeminiEmbeddingModel implements EmbeddingModel {

    private static final String EMBEDDING_MODEL = "gemini-embedding-001";

    private final Client client;

    public GeminiEmbeddingModel(String apiKey) {
        // No apiVersion override → SDK defaults to v1beta, which supports embedding-001
        this.client = Client.builder().apiKey(apiKey).build();
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        for (int i = 0; i < request.getInstructions().size(); i++) {
            float[] vector = embedText(request.getInstructions().get(i));
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
        return embed("test").length;
    }

    private float[] embedText(String text) {
        try {
            EmbedContentResponse response = client.models.embedContent(
                    EMBEDDING_MODEL,
                    com.google.genai.types.Content.builder()
                            .parts(List.of(
                                    com.google.genai.types.Part.builder()
                                            .text(text)
                                            .build()
                            ))
                            .build(),
                    EmbedContentConfig.builder().build()
            );

            List<ContentEmbedding> embeddings = response.embeddings().orElse(List.of());
            if (embeddings.isEmpty()) return new float[0];

            List<Float> values = embeddings.get(0).values().orElse(List.of());
            if (values.isEmpty()) return new float[0];

            //log.info("Embedding dimension = {}", values.size());

            float[] result = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                result[i] = values.get(i);
            }
            return result;

        } catch (Exception e) {
            log.warn("Gemini embedding failed: {}", e.getMessage());
            return new float[0];
        }
    }
}
