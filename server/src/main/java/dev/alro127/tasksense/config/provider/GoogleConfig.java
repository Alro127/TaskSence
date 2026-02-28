package dev.alro127.tasksense.config.provider;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Configuration
@Component
@Data
@ConfigurationProperties(prefix = "security.google")
public class GoogleConfig {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
