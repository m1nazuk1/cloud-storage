package com.example.thesis.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;

import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "app.storage.object-enabled", havingValue = "true")
public class S3ClientConfiguration {

    private static final Logger log = LoggerFactory.getLogger(S3ClientConfiguration.class);

    @Bean
    public S3Client s3Client(StorageProperties properties) {
        AwsBasicCredentials creds = AwsBasicCredentials.create(
                properties.getObjectAccessKey(),
                properties.getObjectSecretKey()
        );
        return S3Client.builder()
                .endpointOverride(URI.create(properties.getObjectEndpoint()))
                .region(Region.of(properties.getObjectRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(creds))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    @Bean
    public ApplicationRunner s3EnsureBucket(S3Client s3Client, StorageProperties properties) {
        return args -> {
            String bucket = properties.getObjectBucket();
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            } catch (software.amazon.awssdk.services.s3.model.NoSuchBucketException e) {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            } catch (Exception e) {
                log.warn("Не удалось проверить/создать бакет S3/MinIO ({}): {}", bucket, e.getMessage());
            }
        };
    }
}
