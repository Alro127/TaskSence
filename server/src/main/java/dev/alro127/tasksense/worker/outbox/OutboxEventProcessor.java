package dev.alro127.tasksense.worker.outbox;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.repository.jpa.OutboxEventRepository;
import dev.alro127.tasksense.service.publisher.NotificationPublisher;
import dev.alro127.tasksense.service.publisher.Publisher;
import dev.alro127.tasksense.service.publisher.PublisherFactory;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxEventProcessor {

    private final PublisherFactory publisherFactory;
    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void processEvent(OutboxEventEntity event) {

        try {

            System.out.println("process event");

            Publisher publisher = publisherFactory.get(event.getEventType());

            Object message = objectMapper.readValue(
                    event.getPayload().toString(),
                    Object.class);

            publisher.publish(message);

            event.setDeliveryStatus(DeliveryStatus.SUCCESS);
            event.setPublishedAt(OffsetDateTime.now());

        } catch (Exception e) {

            event.setRetryCount(event.getRetryCount() + 1);
            event.setDeliveryStatus(DeliveryStatus.FAILED);

            log.error("Failed to process notification event {}", event.getId(), e);
        }

        repository.save(event);
    }
}
