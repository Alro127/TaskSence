package dev.alro127.tasksense.service.publisher;

import dev.alro127.tasksense.domain.enums.OutboxEventType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PublisherFactory {

    private final Map<OutboxEventType, Publisher> publishers;

    public PublisherFactory(List<Publisher> publishers) {
        this.publishers = publishers.stream()
                .collect(Collectors.toMap(Publisher::eventType, p -> p));
    }

    public Publisher get(OutboxEventType eventType) {
        return publishers.get(eventType);
    }
}
