package com.mathtutor.dto;

import java.util.List;

public class OpenAiResponse {

    private List<Choice> choices;

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }

    public static class Choice {

        private MessageDetail message;
        private MessageDetail delta;
        private int index;
        private String finishReason;

        public MessageDetail getMessage() {
            return message;
        }

        public void setMessage(MessageDetail message) {
            this.message = message;
        }

        public MessageDetail getDelta() {
            return delta;
        }

        public void setDelta(MessageDetail delta) {
            this.delta = delta;
        }

        public int getIndex() {
            return index;
        }

        public void setIndex(int index) {
            this.index = index;
        }

        public String getFinishReason() {
            return finishReason;
        }

        public void setFinishReason(String finishReason) {
            this.finishReason = finishReason;
        }
    }

    public static class MessageDetail {

        private String role;
        private String content;

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
