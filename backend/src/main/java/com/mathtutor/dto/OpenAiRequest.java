package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public class OpenAiRequest {

    private String model;
    private List<ChatMessage> messages;
    private boolean stream;
    private double temperature;

    public OpenAiRequest() {
        this.messages = new ArrayList<>();
        this.temperature = 0.7;
    }

    public OpenAiRequest(String model, List<ChatMessage> messages, boolean stream) {
        this.model = model;
        this.messages = messages;
        this.stream = stream;
        this.temperature = 0.7;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessage> messages) {
        this.messages = messages;
    }

    public boolean isStream() {
        return stream;
    }

    public void setStream(boolean stream) {
        this.stream = stream;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }
}
