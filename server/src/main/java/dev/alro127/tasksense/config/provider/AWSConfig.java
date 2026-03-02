package dev.alro127.tasksense.config.provider;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;


@Configuration
@RequiredArgsConstructor
public class AWSConfig {
    private final AWSConfigValue awsConfigValue;
    @Bean
    S3Presigner s3Presigner () {
        return S3Presigner.builder()
                .region(Region.of(awsConfigValue.getRegion()))
                .endpointOverride(URI.create(String.format("https://%s",awsConfigValue.getEndpoint())))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(awsConfigValue.getAccessKey(), awsConfigValue.getSecretKey())))
                .build();
    }
    @Component
    @Getter
    @Setter
    @ConfigurationProperties(prefix = "aws")
    public static class AWSConfigValue {
        private String region;
        private String accessKey;
        private String secretKey;
        private String endpoint;
        private String bucket;
    }
}