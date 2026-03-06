package dev.alro127.tasksense.service.subcriber;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.domain.entity.NotificationEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.repository.jpa.NotificationRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationDbSubscriber implements MessageListener {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {

        System.out.println("NotificationDbSubscriber received message");

        try {

            String body = new String(message.getBody());

            NotificationMessage notification =
                    objectMapper.readValue(body, NotificationMessage.class);

            Map<String, Object> payload = notification.getPayload();

            UserEntity receiver = userRepository.findById(notification.getReceiverId()).orElse(null);

            if (receiver == null) {
                System.out.println("Receiver is null");
                return;
            }

            NotificationEntity entity = NotificationEntity.builder()
                    .receiver(receiver)
                    .actorId(notification.getActorId())
                    .type(notification.getType())
                    .referenceType(notification.getReferenceType())
                    .referenceId(notification.getReferenceId())
                    .payload(payload)
                    .build();

            repository.save(entity);

            System.out.println("Notification saved");

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
