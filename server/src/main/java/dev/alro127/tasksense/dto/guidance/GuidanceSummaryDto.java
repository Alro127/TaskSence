package dev.alro127.tasksense.dto.guidance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuidanceSummaryDto {
    private String overview;
    private List<String> bestPractices;
    private List<String> risks;
}
