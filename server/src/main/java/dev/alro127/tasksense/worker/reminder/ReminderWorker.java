package dev.alro127.tasksense.worker.reminder;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.ReminderService;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReminderWorker {

    private final StringRedisTemplate redisTemplate;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;
    private final ReminderService reminderService;

    @Scheduled(cron = "0 0 0 * * *")
    public void syncReminders(){

        System.out.println("Sync Reminder worker is running");

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime window = now.plusHours(24);

        List<TaskEntity> tasks =
                taskRepository.findTasksWithReminderBetween(now, window);

        for(TaskEntity task : tasks){

            OffsetDateTime reminderTime =
                    task.getDueDate().minusMinutes(15);

            reminderService.scheduleReminder(task.getId(), reminderTime);
        }
    }

    @Scheduled(fixedDelay = 30000)
    public void processReminders(){

        System.out.println("Reminder worker is running");

        long now = Instant.now().toEpochMilli();

        while(true){

            var tuple = redisTemplate.opsForZSet()
                    .popMin(RedisKeys.REMINDER_KEY);

            if(tuple == null){
                break;
            }

            if(tuple.getScore() > now){
                redisTemplate.opsForZSet()
                        .add(RedisKeys.REMINDER_KEY, tuple.getValue(), tuple.getScore());
                break;
            }

            Long taskId = Long.valueOf(tuple.getValue());

            TaskEntity task = taskRepository.findWithAssigneesProjectWorkspace(taskId).orElse(null);

            if(task == null){
                continue;
            }

            for(UserEntity assignee : task.getAssignees()){

                notificationService.saveAndPublish(
                        NotificationMessage.builder()
                                .receiverId(assignee.getId())
                                .type(NotificationType.TASK_REMINDER)
                                .referenceType(EntityType.TASK)
                                .referenceId(task.getId())
                                .payload(Map.of("referenceName", task.getTitle(),
                                        "projectId", task.getProject().getId(),
                                        "workspaceId", task.getProject().getWorkspace().getId()))
                                .build()
                );
            }
        }
    }
}
