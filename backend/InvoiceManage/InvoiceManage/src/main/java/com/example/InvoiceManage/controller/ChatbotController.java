package com.example.InvoiceManage.controller;

import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatbotController {

    private static final String OLLAMA_API_GENERATE_URL = "http://localhost:11434/api/generate";

    @PostMapping("/send") // Frontend sẽ gọi endpoint này
    public ResponseEntity<String> sendMessageToOllamaGenerate(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader // Có thể làm tùy chọn
    ) {
        try {
            String userMessage = body.get("userMessage");

            String modelName = body.getOrDefault("model", "llama2:7b");

            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Message is empty!");
            }

            // Tạo payload cho Ollama /api/generate
            Map<String, Object> ollamaPayload = new HashMap<>();
            ollamaPayload.put("model", modelName); // Sử dụng model được chỉ định hoặc mặc định
            ollamaPayload.put("prompt", userMessage);
            ollamaPayload.put("stream", false); // Chúng ta muốn nhận toàn bộ phản hồi một lần

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ollamaPayload, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> ollamaResponse;

            try {
                ollamaResponse = restTemplate.postForEntity(OLLAMA_API_GENERATE_URL, entity, String.class);
            } catch (HttpClientErrorException e) {
                // Xử lý lỗi từ Ollama (ví dụ: model không tồn tại)
                System.err.println("Ollama API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
                return ResponseEntity.status(e.getStatusCode()).body("Error from Ollama: " + e.getResponseBodyAsString());
            }


            if (ollamaResponse.getStatusCode() == HttpStatus.OK) {
                String responseBody = ollamaResponse.getBody();
                if (responseBody != null) {
                    // Phân tích JSON response từ Ollama để lấy phần "response" text
                    JSONObject jsonResponse = new JSONObject(responseBody);
                    String aiTextResponse = jsonResponse.optString("response", "No response text found.");
                    return ResponseEntity.ok(aiTextResponse);
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ollama returned empty response.");
                }
            } else {
                return ResponseEntity.status(ollamaResponse.getStatusCode()).body("Ollama server error: " + ollamaResponse.getBody());
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing chat message: " + e.getMessage());
        }
    }
}