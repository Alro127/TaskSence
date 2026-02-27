package dev.alro127.tasksense.config.database;

import dev.alro127.tasksense.service.impl.EmailSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RedisConfig {
    @Bean
    RedisTemplate<String, Object> redisTemplate (RedisConnectionFactory connectionFactory) {
        var template = new RedisTemplate<String, Object>();
        template.setConnectionFactory(connectionFactory);
        return template;
    }

    @Bean
    RedisMessageListenerContainer container(
            RedisConnectionFactory connectionFactory,
            EmailSubscriber subscriber
    ) {

        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();

        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(
                subscriber,
                new ChannelTopic("otp-email-channel")
        );

        return container;
    }
}
