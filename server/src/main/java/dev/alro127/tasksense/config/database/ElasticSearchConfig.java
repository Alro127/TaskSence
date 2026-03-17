package dev.alro127.tasksense.config.database;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.util.StringUtils;

@Configuration
@EnableElasticsearchRepositories(basePackages = "dev.alro127.tasksense.repository.elasticsearch")
public class ElasticSearchConfig extends ElasticsearchConfiguration {

    @Value("${spring.elasticsearch.uris:http://localhost:9200}")
    private String uris;

    @Value("${spring.elasticsearch.username:}")
    private String username;

    @Value("${spring.elasticsearch.password:}")
    private String password;

    @Value("${spring.elasticsearch.connection-timeout:5s}")
    private String connectionTimeout;

    @Value("${spring.elasticsearch.socket-timeout:30s}")
    private String socketTimeout;

    @Override
    public ClientConfiguration clientConfiguration() {
        String host = uris.replaceFirst("https?://", "");

        ClientConfiguration.MaybeSecureClientConfigurationBuilder builder =
                ClientConfiguration.builder().connectedTo(host);

        if (uris.startsWith("https")) {
            builder.usingSsl();
        }

        if (StringUtils.hasText(username) && StringUtils.hasText(password)) {
            builder.withBasicAuth(username, password);
        }

        builder.withConnectTimeout(parseDuration(connectionTimeout))
               .withSocketTimeout(parseDuration(socketTimeout));

        return builder.build();
    }

    private java.time.Duration parseDuration(String value) {
        if (value.endsWith("s")) {
            return java.time.Duration.ofSeconds(Long.parseLong(value.replace("s", "")));
        }
        if (value.endsWith("ms")) {
            return java.time.Duration.ofMillis(Long.parseLong(value.replace("ms", "")));
        }
        return java.time.Duration.ofSeconds(Long.parseLong(value));
    }
}
