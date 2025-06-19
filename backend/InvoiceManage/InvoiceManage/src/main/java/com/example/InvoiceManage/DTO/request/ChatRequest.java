package com.example.InvoiceManage.DTO.request;

import java.util.List;

// Request body từ frontend, chứa toàn bộ lịch sử chat
public class ChatRequest {
    private String model;
    private List<ChatMessage> messages; // Thay vì String, giờ là một danh sách tin nhắn

    // Getters and Setters
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
}