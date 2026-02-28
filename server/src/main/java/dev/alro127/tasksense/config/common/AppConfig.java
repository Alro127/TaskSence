package dev.alro127.tasksense.config.common;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "spring.application")
@Getter
@Setter
public class AppConfig {
    private String frontendUrl;
    private String backendUrl;
}
