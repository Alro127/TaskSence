package dev.alro127.tasksense.config.database;

import dev.alro127.tasksense.service.subcriber.EmailSubscriber;
import dev.alro127.tasksense.service.subcriber.NotificationDbSubscriber;
import dev.alro127.tasksense.service.subcriber.SocketSubscriber;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import tools.jackson.databind.ObjectMapper;

@Configuration
@RequiredArgsConstructor
public class RedisConfig {

    private final EmailSubscriber emailSubscriber;
    private final NotificationDbSubscriber notificationDbSubscriber;
    private final SocketSubscriber socketSubscriber;

//    @Bean
//    public RedisTemplate<String, String> stringRedisTemplate(RedisConnectionFactory factory) {
//
//        RedisTemplate<String, String> template = new RedisTemplate<>();
//
//        template.setConnectionFactory(factory);
//
//        StringRedisSerializer serializer = new StringRedisSerializer();
//
//        template.setKeySerializer(serializer);
//        template.setValueSerializer(serializer);
//
//        template.setHashKeySerializer(serializer);
//        template.setHashValueSerializer(serializer);
//
//        template.afterPropertiesSet();
//
//        return template;
//    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();

        ObjectMapper objectMapper = new ObjectMapper();

        GenericJacksonJsonRedisSerializer valueSerializer =
                new GenericJacksonJsonRedisSerializer(objectMapper);

        template.setKeySerializer(keySerializer);
        template.setValueSerializer(valueSerializer);

        template.setHashKeySerializer(keySerializer);
        template.setHashValueSerializer(valueSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisMessageListenerContainer container(
            RedisConnectionFactory connectionFactory
    ) {

        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();

        container.setConnectionFactory(connectionFactory);

        // Email channels
        container.addMessageListener(
                emailSubscriber,
                new ChannelTopic(RedisKeys.AUTH_EMAIL_CHANNEL)
        );

        // Notification channels
        container.addMessageListener(
                notificationDbSubscriber,
                new ChannelTopic(RedisKeys.NOTIFICATION_CHANNEL)
        );

        container.addMessageListener(
                socketSubscriber,
                new ChannelTopic(RedisKeys.NOTIFICATION_CHANNEL)
        );

        return container;
    }
}