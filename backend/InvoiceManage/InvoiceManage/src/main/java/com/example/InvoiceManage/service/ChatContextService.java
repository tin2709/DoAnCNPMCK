package com.example.InvoiceManage.service;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;
@Service
public class ChatContextService {
    // Lưu trữ các đoạn văn bản (chunks) từ tài liệu trong bộ nhớ.
// Dữ liệu này sẽ bị mất khi ứng dụng khởi động lại.
    private List<String> documentChunks = new ArrayList<>();

    /**
     * Nạp và xử lý tài liệu từ một file được tải lên.
     *
     * @param file File MultipartFile từ request.
     * @throws Exception nếu có lỗi khi đọc file.
     */
    public void loadDocument(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        try (InputStream inputStream = file.getInputStream()) {
            processInputStream(inputStream);
        }
    }

    /**
     * Nạp và xử lý tài liệu từ một đường dẫn file trên server.
     *
     * @param filePath Đường dẫn tuyệt đối đến file.
     * @throws Exception nếu file không tồn tại hoặc có lỗi khi đọc.
     */
    public void loadDocumentFromPath(String filePath) throws Exception {
        File file = new File(filePath);
        if (!file.exists() || file.isDirectory()) {
            throw new IllegalArgumentException("File not found or is a directory at path: " + filePath);
        }
        try (InputStream inputStream = new FileInputStream(file)) {
            processInputStream(inputStream);
        }
    }

    /**
     * Logic chung để xử lý một InputStream: đọc văn bản và chia thành các đoạn.
     *
     * @param inputStream Dữ liệu đầu vào của file.
     * @throws Exception nếu có lỗi trong quá trình xử lý.
     */
    private void processInputStream(InputStream inputStream) throws Exception {
        clearContext(); // Xóa ngữ cảnh cũ trước khi nạp cái mới
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

            String text = extractor.getText();
            // Chia văn bản thành các đoạn dựa trên các dòng trống
            this.documentChunks = Arrays.stream(text.split("\\n\\s*\\n"))
                    .map(String::trim) // Loại bỏ khoảng trắng thừa
                    .filter(chunk -> !chunk.isEmpty()) // Bỏ qua các đoạn rỗng
                    .collect(Collectors.toList());

            System.out.println("Document loaded and split into " + documentChunks.size() + " chunks.");
        }
    }

    /**
     * Tìm kiếm và trả về các đoạn văn bản có liên quan nhất đến câu hỏi của người dùng.
     * Sử dụng thuật toán tính điểm để tăng độ chính xác.
     *
     * @param userQuery Câu hỏi của người dùng.
     * @return Một chuỗi chứa các đoạn văn bản liên quan nhất, được sắp xếp theo điểm.
     */
    public String findRelevantContext(String userQuery) {
        if (documentChunks.isEmpty()) {
            return "";
        }

        // Tách câu hỏi thành các từ khóa, loại bỏ các từ vô nghĩa (stop words)
        final List<String> keywords = Arrays.stream(userQuery.toLowerCase().split("\\s+"))
                .filter(word -> word.length() > 2 && !isStopWord(word))
                .collect(Collectors.toList());

        if (keywords.isEmpty()) {
            return ""; // Không có từ khóa hợp lệ để tìm kiếm
        }

        // Chấm điểm, sắp xếp và lấy các đoạn văn bản tốt nhất
        return documentChunks.stream()
                .map(chunk -> {
                    long score = calculateScore(chunk, keywords);
                    return new AbstractMap.SimpleEntry<>(chunk, score);
                })
                .filter(entry -> entry.getValue() > 0) // Chỉ giữ lại các đoạn có điểm > 0
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed()) // Sắp xếp điểm từ cao xuống thấp
                .limit(3) // Giới hạn chỉ lấy 3 đoạn tốt nhất để tránh làm prompt quá dài
                .map(Map.Entry::getKey)
                .collect(Collectors.joining("\n\n---\n\n")); // Nối các đoạn lại với nhau
    }

    /**
     * Xóa ngữ cảnh hiện tại khỏi bộ nhớ.
     */
    public void clearContext() {
        this.documentChunks.clear();
        System.out.println("Context has been cleared.");
    }

// ================== CÁC PHƯƠNG THỨC HỖ TRỢ ==================

    /**
     * Tính điểm cho một đoạn văn bản dựa trên sự xuất hiện của các từ khóa.
     *
     * @param chunk    Đoạn văn bản cần tính điểm.
     * @param keywords Danh sách các từ khóa để tìm kiếm.
     * @return Điểm số của đoạn văn bản.
     */
    private long calculateScore(String chunk, List<String> keywords) {
        long score = 0;
        String lowerCaseChunk = chunk.toLowerCase();

        // Cộng điểm cho mỗi từ khóa được tìm thấy
        for (String keyword : keywords) {
            if (lowerCaseChunk.contains(keyword)) {
                score++;
            }
        }

        // Thưởng điểm cho các đoạn văn bản quan trọng (ví dụ: nằm ở đầu tài liệu)
        // Điều này giúp ưu tiên các phần như "Tóm tắt" hay "Giới thiệu"
        int indexInDocument = documentChunks.indexOf(chunk);
        if (indexInDocument != -1 && indexInDocument < 10) { // Nếu là một trong 10 đoạn đầu tiên
            score += 2; // Cộng thêm 2 điểm thưởng
        }

        return score;
    }

    /**
     * Kiểm tra xem một từ có phải là "stop word" (từ phổ biến, ít mang ý nghĩa) hay không.
     *
     * @param word Từ cần kiểm tra.
     * @return true nếu là stop word, ngược lại là false.
     */
    private boolean isStopWord(String word) {
        // Danh sách các stop words tiếng Việt cơ bản. Có thể mở rộng để kết quả tốt hơn.
        List<String> stopWords = Arrays.asList(
                "là", "gì", "cái", "này", "về", "của", "và", "được", "trong", "một", "có", "không", "để",
                "tôi", "bạn", "nó", "họ", "khi", "thì", "mà", "tại", "cho", "với", "như", "làm"
        );
        return stopWords.contains(word.toLowerCase());
    }
}