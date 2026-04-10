package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.response.DeadlineItem;
import dev.alro127.tasksense.dto.response.DashboardProjectItem;
import dev.alro127.tasksense.dto.response.DashboardSummaryResponse;
import dev.alro127.tasksense.dto.response.DashboardTaskItem;
import dev.alro127.tasksense.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Get dashboard summary successfully",
                dashboardService.getSummary(),
                null));
    }

    @GetMapping("/active-projects")
    public ResponseEntity<ApiResponse<List<DashboardProjectItem>>> getActiveProjects() {
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Get active projects successfully",
                dashboardService.getActiveProjects(),
                null));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<PageResponse<DashboardTaskItem>>> getMyTasks(
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Get my tasks successfully",
                dashboardService.getMyTasks(filter, PageRequest.of(page, size)),
                null));
    }

    @GetMapping("/upcoming-deadlines")
    public ResponseEntity<ApiResponse<List<DeadlineItem>>> getUpcomingDeadlines(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Get upcoming deadlines successfully",
                dashboardService.getUpcomingDeadlines(days),
                null));
    }
}
