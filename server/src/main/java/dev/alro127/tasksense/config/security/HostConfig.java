package dev.alro127.tasksense.config.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Data
@Configuration
@ConfigurationProperties(prefix = "server")
public class HostConfig {
    private int port;
    private Servlet servlet;
    private List<String> originAllows;
    @Data
    public static class Servlet {
        private String contextPath;
    }
}
