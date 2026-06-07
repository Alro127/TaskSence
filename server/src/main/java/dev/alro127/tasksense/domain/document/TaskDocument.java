package dev.alro127.tasksense.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;

import java.time.OffsetDateTime;
import java.util.List;

@Document(indexName = "tasks", createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long projectId;

    @Field(type = FieldType.Keyword)
    private String projectName;

    @Field(type = FieldType.Long)
    private Long workspaceId;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private TaskStatus status;

    @Field(type = FieldType.Keyword)
    private TaskPriority priority;

    @Field(type = FieldType.Long)
    private Long parentTaskId;

    @Field(type = FieldType.Long)
    private Long sprintId;

    @Field(type = FieldType.Keyword)
    private String sprintName;

    @Field(type = FieldType.Long)
    private Long createdById;

    @Field(type = FieldType.Keyword)
    private String createdByName;

    @Field(type = FieldType.Nested)
    private List<UserRef> assignees;

    @Field(type = FieldType.Keyword)
    private List<String> tagNames;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime startDate;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime dueDate;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime completedAt;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime createdAt;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime updatedAt;
}
