package dev.alro127.tasksense.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @NonNull
    private String email;
    @NonNull
    private String password;
}