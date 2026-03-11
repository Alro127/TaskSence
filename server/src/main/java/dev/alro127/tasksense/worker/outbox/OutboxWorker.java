package dev.alro127.tasksense.worker.outbox;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.repository.jpa.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxWorker {

    private final OutboxEventRepository repository;
    private final OutboxEventProcessor processor;

    @Scheduled(fixedDelay = 10000)
    public void processNotificationEvents() {

        System.out.println("Worker is running");
        while (true) {

            List<OutboxEventEntity> events =
                    repository.lockEventsForProcessing(
                            OutboxEventType.NOTIFICATION.name(),
                            100
                    );

            if (events.isEmpty()) {
                System.out.println("events is empty");
                return;
            }

            events.forEach(processor::processEvent);
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void processEmailEvents() {

        System.out.println("Worker is running");
        while (true) {

            List<OutboxEventEntity> events =
                    repository.lockEventsForProcessing(
                            OutboxEventType.EMAIL.name(),
                            100
                    );

            if (events.isEmpty()) {
                System.out.println("events is empty");
                return;
            }

            events.forEach(processor::processEvent);
        }
    }
}