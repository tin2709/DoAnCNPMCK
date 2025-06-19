package com.example.InvoiceManage.DTO.request;

// Đại diện cho một tin nhắn trong cuộc trò chuyện
public class ChatMessage {
    private String role;
    private String content;

    // Constructors, Getters, and Setters
    public ChatMessage() {}

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}