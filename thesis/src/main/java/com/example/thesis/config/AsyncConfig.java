package com.example.thesis.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5); // Основное количество потоков
        executor.setMaxPoolSize(10); // Максимальное количество потоков
        executor.setQueueCapacity(100); // Размер очереди
        executor.setThreadNamePrefix("Async-Email-");
        executor.initialize();
        return executor;
    }
}