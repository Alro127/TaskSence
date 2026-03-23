package dev.alro127.tasksense.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.OffsetDateTime;

@Document(indexName = "comments", createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long taskId;

    @Field(type = FieldType.Keyword)
    private String taskTitle;

    @Field(type = FieldType.Long)
    private Long projectId;

    @Field(type = FieldType.Long)
    private Long workspaceId;

    @Field(type = FieldType.Long)
    private Long userId;

    @Field(type = FieldType.Keyword)
    private String userFullName;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String content;

    @Field(type = FieldType.Long)
    private Long parentCommentId;

    @Field(type = FieldType.Boolean)
    private Boolean isEdited;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime createdAt;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime updatedAt;

    @Field(type = FieldType.Dense_Vector, dims = 768)
    private float[] embedding;
}
