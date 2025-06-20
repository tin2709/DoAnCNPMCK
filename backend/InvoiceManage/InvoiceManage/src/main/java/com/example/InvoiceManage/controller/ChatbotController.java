package com.example.InvoiceManage.controller;

import com.example.InvoiceManage.DTO.request.ChatMessage;
import com.example.InvoiceManage.DTO.request.ChatRequest;
import com.example.InvoiceManage.service.ChatContextService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatbotController {

    // *** THAY ĐỔI QUAN TRỌNG: Quay lại dùng /api/chat để có bộ nhớ ***
    private static final String OLLAMA_API_CHAT_URL = "http://localhost:11434/api/chat";
    private static final String DEFAULT_MODEL = "mistral"; // Đặt mistral làm model mặc định

    @Autowired
    private ChatContextService contextService;

    // Endpoint upload file giữ nguyên
    @PostMapping("/upload-context")
    public ResponseEntity<String> uploadContextDocument(@RequestParam("file") MultipartFile file) {
        try {
            contextService.loadDocument(file);
            return ResponseEntity.ok("Document loaded successfully as context.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load document: " + e.getMessage());
        }
    }

    // *** ENDPOINT MỚI: Nạp tài liệu từ đường dẫn trên server ***
    @PostMapping("/load-from-path")
    public ResponseEntity<String> loadContextFromPath(@RequestBody Map<String, String> payload) {
        try {
            String filePath = payload.get("path");
            if (filePath == null || filePath.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("File path is required.");
            }
            contextService.loadDocumentFromPath(filePath);
            return ResponseEntity.ok("Document from path '" + filePath + "' loaded successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load document from path: " + e.getMessage());
        }
    }

    @PostMapping("/clear-context")
    public ResponseEntity<String> clearContext() {
        contextService.clearContext();
        return ResponseEntity.ok("Context has been cleared.");
    }

    @PostMapping("/conversation")
    public ResponseEntity<String> chatWithOllama(@RequestBody ChatRequest chatRequest) {
        try {
            // Sử dụng model được chỉ định hoặc mistral làm mặc định
            String modelName = (chatRequest.getModel() != null && !chatRequest.getModel().isEmpty())
                    ? chatRequest.getModel()
                    : DEFAULT_MODEL;

            List<ChatMessage> history = chatRequest.getMessages();
            if (history == null || history.isEmpty()) {
                return ResponseEntity.badRequest().body("Message history cannot be empty.");
            }

            String latestUserQuery = history.get(history.size() - 1).getContent();
            String relevantContext = contextService.findRelevantContext(latestUserQuery);

            // 1. *** SYSTEM PROMPT MỚI: Rõ ràng, dứt khoát và bằng tiếng Việt ***
            // Ra lệnh trực tiếp cho model, cấm các hành vi không mong muốn.
            String systemPromptContent =
                    "Bạn là một trợ lý ảo, chỉ trả lời dựa trên sự thật. Hãy tuân thủ nghiêm ngặt các quy tắc sau:\n" +
                            "1. CHỈ được trả lời câu hỏi của người dùng dựa vào 'NGỮ CẢNH' được cung cấp.\n" +
                            "2. Trả lời ngắn gọn, đi thẳng vào vấn đề. Trả lời bằng tiếng Việt.\n" +
                            "3. TUYỆT ĐỐI KHÔNG thêm lời chào, lời bình luận, hay tự giới thiệu. \n" +
                            "4. Nếu không tìm thấy thông tin trong 'NGỮ CẢNH', chỉ cần trả lời DUY NHẤT một câu: 'Tôi không tìm thấy thông tin này trong tài liệu.'";

            // 2. *** CẤU TRÚC LẠI PAYLOAD GỬI ĐẾN OLLAMA ***
            List<ChatMessage> messagesForOllama = new ArrayList<>();
            messagesForOllama.add(new ChatMessage("system", systemPromptContent));

            // Thay vì đưa context vào system prompt, ta đặt nó rõ ràng trong user prompt
            // để model tập trung hơn vào nhiệm vụ.
            String userPromptWithContext = "NGỮ CẢNH:\n\"" +
                    (relevantContext.isEmpty() ? "Không có ngữ cảnh nào được cung cấp." : relevantContext) +
                    "\"\n\n" +
                    "DỰA VÀO NGỮ CẢNH TRÊN, hãy trả lời câu hỏi sau:\n\"" + latestUserQuery + "\"";

            messagesForOllama.add(new ChatMessage("user", userPromptWithContext));

            // --- PHẦN TÙY CHỌN: KÍCH HOẠT LẠI BỘ NHỚ CHO HỘI THOẠI DÀI ---
            // Để có câu trả lời ngắn gọn nhất cho từng câu hỏi, ta tạm thời không gửi toàn bộ lịch sử.
            // Nếu bạn muốn chatbot "nhớ" các câu hỏi trước đó (ví dụ: hỏi "nó dùng công nghệ gì?"),
            // hãy bỏ comment ở dòng dưới đây. Lưu ý rằng việc này có thể làm câu trả lời dài hơn một chút.
            // messagesForOllama.addAll(history);

            Map<String, Object> ollamaPayload = new HashMap<>();
            ollamaPayload.put("model", modelName);
            ollamaPayload.put("messages", messagesForOllama);
            ollamaPayload.put("stream", false);
            // Thêm các tham số để kiểm soát model tốt hơn (tùy chọn)
            Map<String, Object> options = new HashMap<>();
            options.put("temperature", 0.3); // Giảm nhiệt độ để câu trả lời bám sát sự thật, ít sáng tạo hơn
            ollamaPayload.put("options", options);


            // Phần gọi RestTemplate giữ nguyên...
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ollamaPayload, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> ollamaResponse;

            try {
                ollamaResponse = restTemplate.postForEntity(OLLAMA_API_CHAT_URL, entity, String.class);
            } catch (HttpClientErrorException e) {
                return ResponseEntity.status(e.getStatusCode()).body("Error from Ollama: " + e.getResponseBodyAsString());
            }

            if (ollamaResponse.getStatusCode() == HttpStatus.OK && ollamaResponse.getBody() != null) {
                JSONObject jsonResponse = new JSONObject(ollamaResponse.getBody());
                String aiTextResponse = jsonResponse.getJSONObject("message").getString("content");
                return ResponseEntity.ok(aiTextResponse.trim());
            } else {
                return ResponseEntity.status(ollamaResponse.getStatusCode()).body("Ollama server error: " + ollamaResponse.getBody());
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing chat message: " + e.getMessage());
        }
    }
}