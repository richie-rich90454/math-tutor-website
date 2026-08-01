package com.mathtutor;

import com.mathtutor.config.DotEnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MathTutorApplication {

    public static void main(String[] args) {
        DotEnvLoader.load();
        SpringApplication.run(MathTutorApplication.class, args);
    }
}
