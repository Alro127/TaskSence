package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.response.DeadlineItem;
import dev.alro127.tasksense.dto.response.DashboardProjectItem;
import dev.alro127.tasksense.dto.response.DashboardSummaryResponse;
import dev.alro127.tasksense.dto.response.DashboardTaskItem;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DashboardService {

    DashboardSummaryResponse getSummary();

    List<DashboardProjectItem> getActiveProjects();

    PageResponse<DashboardTaskItem> getMyTasks(String filter, Pageable pageable);

    List<DeadlineItem> getUpcomingDeadlines(int days);
}
