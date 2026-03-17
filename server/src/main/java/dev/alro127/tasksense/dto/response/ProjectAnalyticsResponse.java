package dev.alro127.tasksense.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAnalyticsResponse {

    /** Tổng số task trong project */
    private long totalTasks;

    /** Phân bố số task theo status: TODO / IN_PROGRESS / REVIEW / DONE */
    private Map<String, Long> statusDistribution;

    /** Phân bố số task theo priority: LOW / MEDIUM / HIGH / URGENT */
    private Map<String, Long> priorityDistribution;

    /** Số task quá hạn (dueDate < now AND status != DONE) */
    private long overdueCount;

    /** Số task hoàn thành theo ngày trong 30 ngày gần nhất */
    private List<DayCount> completionTrend;

    /**
     * Điểm sức khoẻ project (0–100).
     * = completionRate * 60% + onTimeRate * 40%
     */
    private int healthScore;

    /**
     * Ngày dự kiến hoàn thành project (yyyy-MM-dd).
     * Tính từ velocity 30 ngày gần nhất. Null nếu không đủ dữ liệu.
     */
    private String projectedCompletionDate;

    /** Tốc độ hoàn thành trung bình (task/ngày) trong 30 ngày gần nhất */
    private double avgDailyVelocity;

    /** Số task DONE theo từng sprint */
    private List<SprintVelocity> sprintVelocity;

    /** Hiệu suất từng thành viên */
    private List<MemberPerformance> memberPerformance;

    // ─── Inner classes ────────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DayCount {
        private String date;
        private long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SprintVelocity {
        private Long sprintId;
        private long completedCount;
    }

    /**
     * Hiệu suất của một thành viên trong project.
     * performanceScore (0–100) = completionRate * 60% + onTimeRate * 40%
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MemberPerformance {
        private Long userId;
        private long assignedCount;
        private long completedCount;
        private long overdueCount;
        private int performanceScore;
    }
}
