package dev.alro127.tasksense.domain.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import dev.alro127.tasksense.domain.enums.Gender;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Document(indexName = "users", createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDocument {

    @Id
    private Long id;

    @Field(type = FieldType.Keyword)
    private String email;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String fullName;

    @Field(type = FieldType.Boolean)
    private Boolean isActive;

    @Field(type = FieldType.Keyword)
    private String avatarUrl;

    @Field(type = FieldType.Keyword)
    private String phone;

    @Field(type = FieldType.Keyword)
    private Gender gender;

    @Field(type = FieldType.Date, format = DateFormat.year_month_day)
    private LocalDate dob;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String bio;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime createdAt;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private OffsetDateTime updatedAt;
}
