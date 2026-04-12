package com.example.thesis.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class DatasourceInfoLogger {

    private static final Logger log = LoggerFactory.getLogger(DatasourceInfoLogger.class);

    private final Environment environment;

    public DatasourceInfoLogger(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDatasource(ApplicationReadyEvent event) {
        String url = environment.getProperty("spring.datasource.url");
        if (url != null && !url.isBlank()) {
            log.info(
                    "[DB] Активный spring.datasource.url = {} (если после сброса Docker email «занят» — проверьте, что backend смотрит на ту же БД, которую вы чистите)",
                    url
            );
        }
    }
}
