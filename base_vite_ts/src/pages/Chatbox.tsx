import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiRefreshCw, FiSend } from 'react-icons/fi'; // Import icons for better visuals

// --- INTERFACES & TYPES ---

// Định nghĩa cấu trúc tin nhắn mà backend yêu cầu
interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Định nghĩa props cho component
interface ChatboxProps {
  onClose: () => void;
}

// --- API CONFIGURATION ---
const API_BASE_URL = 'http://localhost:8080/api/chat'; // Centralize base URL
const DOCUMENT_PATH = 'C:/Users/ADMIN/Documents/Word DA CNPM.docx'; // Đường dẫn file tài liệu

// --- HELPER FUNCTIONS ---

// Hàm lấy token từ localStorage
const getAuthToken = (): string | null => {
  // Hàm này lấy token đã được lưu trong localStorage sau khi người dùng đăng nhập.
  // Đảm bảo rằng bạn đã lưu token với key là 'accessToken' trong ứng dụng của mình.
  return localStorage.getItem('accessToken');
};

// --- MAIN COMPONENT ---

const Chatbox: React.FC<ChatboxProps> = ({ onClose }) => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // Trạng thái để biết đã nạp tài liệu chưa
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- API FUNCTIONS ---

  // Hàm nạp tài liệu ngữ cảnh
  const loadContextDocument = async () => {
    setIsLoading(true);
    setMessages([]); // Xóa tin nhắn cũ khi bắt đầu nạp
    const token = getAuthToken();
    if (!token) {
      setMessages([{ role: 'assistant', content: 'Lỗi: Không tìm thấy token xác thực. Vui lòng đăng nhập lại.' }]);
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/load-from-path`,
        { path: DOCUMENT_PATH.replace(/\\/g, '/') }, // Gửi đường dẫn đã chuẩn hóa
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      // Thêm tin nhắn chào mừng sau khi nạp thành công
      setMessages([{ role: 'assistant', content: 'Xin chào! Tôi có thể giúp gì cho bạn về dự án này?' }]);
      setIsInitialized(true);
    } catch (error) {
      console.error("Error loading context document:", error);
      // Kiểm tra lỗi 401 hoặc 403 để thông báo hết hạn token
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        setMessages([{ role: 'assistant', content: 'Lỗi: Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }]);
      } else {
        setMessages([{ role: 'assistant', content: 'Lỗi: Không thể nạp tài liệu cho trợ lý AI.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xóa ngữ cảnh và reset chat
  const handleResetChat = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Lỗi xác thực. Không thể reset.');
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/clear-context`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      // Sau khi xóa thành công, nạp lại tài liệu để bắt đầu phiên mới
      await loadContextDocument();
    } catch (error) {
      console.error("Error resetting chat context:", error);
      alert('Đã xảy ra lỗi khi cố gắng làm mới cuộc trò chuyện.');
    }
  };


  // Hàm gửi tin nhắn tới API /conversation
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newUserMessage: ApiMessage = { role: 'user', content: input };
    const updatedMessages: ApiMessage[] = [...messages, newUserMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    const token = getAuthToken();
    if (!token) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Lỗi: Không tìm thấy token xác thực. Vui lòng đăng nhập lại.' }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post<string>(
        `${API_BASE_URL}/conversation`,
        {
          model: 'mistral', // Hoặc model mặc định của bạn
          messages: updatedMessages, // Gửi toàn bộ lịch sử chat
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const botReply: ApiMessage = { role: 'assistant', content: response.data };
      setMessages(prev => [...prev, botReply]);

    } catch (error) {
      console.error("Error sending message:", error);
      // Kiểm tra lỗi 401 hoặc 403 để thông báo hết hạn token
      let errorMessageContent = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.';
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        errorMessageContent = 'Lỗi: Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      }
      const errorMessage: ApiMessage = { role: 'assistant', content: errorMessageContent };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECTS ---

  // Tự động nạp tài liệu khi component được mở lần đầu
  useEffect(() => {
    if (!isInitialized) {
      loadContextDocument();
    }
  }, [isInitialized]); // Chỉ chạy một lần

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- EVENT HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>AI Assistant</span>
        <button onClick={handleResetChat} style={styles.resetButton} title="Bắt đầu cuộc trò chuyện mới">
          <FiRefreshCw size={16} />
        </button>
        <button onClick={onClose} style={styles.closeButton} title="Đóng chat">
          ✕
        </button>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.messageBubble(msg.role)}>
            {msg.role === 'assistant' && <div style={styles.botIcon}>🤖</div>}
            <div style={styles.messageText(msg.role)}>{msg.content}</div>
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Hỏi tôi về dự án..."
          style={styles.inputField}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          style={styles.sendButton}
          disabled={isLoading}
        >
          <FiSend size={20} />
        </button>
      </div>
    </div>
  );
};

// --- STYLED COMPONENTS & SUB-COMPONENTS ---
const TypingIndicator: React.FC = () => (
  <div style={styles.messageBubble('assistant')}>
    <div style={styles.botIcon}>🤖</div>
    <div style={{ ...styles.messageText('assistant'), display: 'flex' }}>
      <span style={styles.typingDot(0)}></span>
      <span style={styles.typingDot(0.2)}></span>
      <span style={styles.typingDot(0.4)}></span>
    </div>
  </div>
);


// Di chuyển styles vào trong component để dễ quản lý
const styles = {
  container: {
    width: 370, height: 600, position: 'fixed', bottom: 20, right: 20,
    background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', zIndex: 1001
  } as React.CSSProperties,
  header: {
    display: 'flex', alignItems: 'center', padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb', background: '#f9fafb', position: 'relative'
  } as React.CSSProperties,
  headerTitle: {
    fontWeight: 600, fontSize: 18, color: '#111827', flexGrow: 1
  } as React.CSSProperties,
  resetButton: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6b7280', padding: 5, marginRight: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  } as React.CSSProperties,
  closeButton: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6b7280', fontSize: 20, padding: 5
  } as React.CSSProperties,
  messagesContainer: {
    flex: 1, overflowY: 'auto', padding: '15px'
  } as React.CSSProperties,
  messageBubble: (role: 'user' | 'assistant') => ({
    display: 'flex', alignItems: 'flex-end', margin: '10px 0',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  }) as React.CSSProperties,
  botIcon: {
    width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginRight: 10, fontSize: 20
  } as React.CSSProperties,
  messageText: (role: 'user' | 'assistant') => ({
    padding: '10px 16px', borderRadius: 18, maxWidth: '80%',
    background: role === 'user' ? '#3b82f6' : '#f3f4f6',
    color: role === 'user' ? '#fff' : '#1f2937',
    lineHeight: 1.5, wordWrap: 'break-word'
  }) as React.CSSProperties,
  inputArea: {
    display: 'flex', alignItems: 'center', padding: '10px 15px',
    borderTop: '1px solid #e5e7eb'
  } as React.CSSProperties,
  inputField: {
    flex: 1, padding: '10px 16px', border: '1px solid #d1d5db',
    borderRadius: 20, outline: 'none', marginRight: 10
  } as React.CSSProperties,
  sendButton: {
    width: 40, height: 40, borderRadius: '50%', background: '#3b82f6',
    color: '#fff', border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  } as React.CSSProperties,
  typingDot: (delay: number) => ({
    width: 8, height: 8, margin: '0 2px', background: '#9ca3af',
    borderRadius: '50%',
    animation: `typingAnimation 1.4s infinite ease-in-out ${delay}s`
  }) as React.CSSProperties,
};

// Thêm keyframes vào document để không bị lỗi inline style
const keyframes = `
@keyframes typingAnimation {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  40% { opacity: 1; transform: scale(1); }
}`;

// Chỉ thêm stylesheet một lần để tránh trùng lặp
if (!document.getElementById('chatbox-keyframes')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'chatbox-keyframes';
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}


export default Chatbox;