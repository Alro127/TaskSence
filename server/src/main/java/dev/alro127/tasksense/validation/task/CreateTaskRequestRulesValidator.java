package dev.alro127.tasksense.validation.task;

import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.validation.DtoRuleValidator;
import dev.alro127.tasksense.validation.ValidationErrors;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class CreateTaskRequestRulesValidator implements DtoRuleValidator<CreateTaskRequest> {

    @Override
    public void validate(CreateTaskRequest target, ValidationErrors errors) {
        validateDateRange(target.getStartDate(), target.getDueDate(), errors);
        validateIdList("tagIds", target.getTagIds(), errors);
        validateIdList("assigneeIds", target.getAssigneeIds(), errors);
    }

    private void validateDateRange(OffsetDateTime startDate, OffsetDateTime dueDate, ValidationErrors errors) {
        if (startDate != null && dueDate != null && dueDate.isBefore(startDate)) {
            errors.reject("dueDate", "Due date must be after or equal to start date");
        }
    }

    private void validateIdList(String fieldName, List<Long> ids, ValidationErrors errors) {
        if (ids == null || ids.isEmpty()) {
            return;
        }

        Set<Long> seen = new HashSet<>();
        for (Long id : ids) {
            if (id == null || id <= 0) {
                errors.reject(fieldName, "All IDs must be positive numbers");
                return;
            }

            if (!seen.add(id)) {
                errors.reject(fieldName, "Duplicate IDs are not allowed");
                return;
            }
        }
    }
}
