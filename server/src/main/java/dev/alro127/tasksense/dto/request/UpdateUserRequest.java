package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {

    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @Pattern(
            regexp = "^(\\+84|0)[0-9]{9}$",
            message = "Phone number must be a valid Vietnamese number"
    )
    private String phone;

    private Gender gender;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dob;

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;

    @Size(max = 2000, message = "Avatar URL is too long")
    private String avatarUrl;
}