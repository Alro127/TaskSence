package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

import dev.alro127.tasksense.domain.entity.TagEntity;

@Data
@Builder
public class TagResponse {

    private Long id;

    private String name;

    private String color;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static TagResponse mapToResponse(TagEntity tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .build();
    }
}
