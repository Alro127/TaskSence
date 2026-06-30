package dev.alro127.tasksense.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import dev.alro127.tasksense.domain.enums.ProjectStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Document(indexName = "projects", createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Long)
    private Long workspaceId;

    @Field(type = FieldType.Keyword)
    private String workspaceName;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private ProjectStatus status;

    @Field(type = FieldType.Date, format = DateFormat.year_month_day)
    private LocalDate startDate;

    @Field(type = FieldType.Date, format = DateFormat.year_month_day)
    private LocalDate endDate;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime createdAt;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime updatedAt;
}
