import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Define the structure of a message
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// Define the props for the Chatbox component
interface ChatboxProps {
  onClose: () => void;
}

// Style types
type ChatboxStyles = {
  container: React.CSSProperties;
  header: React.CSSProperties;
  closeButton: React.CSSProperties;
  messagesContainer: React.CSSProperties;
  messageBubble: (sender: 'user' | 'bot') => React.CSSProperties;
  messageText: (sender: 'user' | 'bot') => React.CSSProperties;
  botIcon: React.CSSProperties;
  inputArea: React.CSSProperties;
  inputField: React.CSSProperties;
  sendButton: React.CSSProperties;
  // For typing indicator specifically - these will be added after initial declaration
  typingIndicatorBubble?: React.CSSProperties;
  typingIndicatorDotContainer?: React.CSSProperties;
};

// --- Initial freshChatboxStyles without self-referencing typing indicator styles ---
let freshChatboxStyles: ChatboxStyles = { // Use 'let' to allow modification
  container: {
    width: 360,
    height: 580,
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '0px',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', sans-serif",
    color: '#333333',
    zIndex: 1001,
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
    textAlign: 'left',
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 20px',
    borderBottom: '1px solid #eeeeee',
    color: '#1a202c',
    background: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: '50%',
    right: '15px',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#718096',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '5px',
    lineHeight: '1',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px 20px',
    background: '#ffffff',
    scrollbarWidth: 'thin' as 'thin',
    scrollbarColor: '#00BFA6 #f0f0f0',
  },
  messageBubble: (sender) => ({
    margin: '10px 0',
    display: 'flex',
    justifyContent: sender === 'user' ? 'flex-end' : 'flex-start',
    alignItems: 'flex-end',
  }),
  messageText: (sender) => ({
    display: 'inline-block',
    background: sender === 'user' ? '#00BFA6' : '#EDF2F7',
    color: sender === 'user' ? '#ffffff' : '#2D3748',
    padding: '10px 16px',
    borderRadius: sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
    maxWidth: '80%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    lineHeight: '1.5',
  }),
  botIcon: {
    marginRight: '10px',
    fontSize: '24px',
    color: '#718096',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#EDF2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderTop: '1px solid #eeeeee',
    background: '#f7fafc',
  },
  inputField: {
    flex: 1,
    padding: '12px 18px',
    border: '1px solid #E2E8F0',
    borderRadius: '25px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#2D3748',
    marginRight: '10px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  sendButton: {
    padding: '0px',
    width: '44px',
    height: '44px',
    border: 'none',
    borderRadius: '50%',
    background: '#00BFA6',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  // typingIndicatorBubble and typingIndicatorDotContainer will be added below
};

// --- Now, define and add the typing indicator styles ---
freshChatboxStyles.typingIndicatorBubble = {
  ...freshChatboxStyles.messageBubble('bot'),
};

freshChatboxStyles.typingIndicatorDotContainer = {
  ...freshChatboxStyles.messageText('bot'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px', // Adjust padding for dots
  minHeight: '40px', // Ensure consistent height
};
// --- End of style modifications ---


const GlobalStyles: React.FC = () => (
  <style>{`
    .webkit-scrollbar-fresh::-webkit-scrollbar {
        width: 6px;
    }
    .webkit-scrollbar-fresh::-webkit-scrollbar-track {
        background: #f0f0f0;
        border-radius: 3px;
    }
    .webkit-scrollbar-fresh::-webkit-scrollbar-thumb {
        background-color: #00BFA6;
        border-radius: 3px;
    }
    .chat-input-field:focus {
        border-color: #00BFA6 !important;
        box-shadow: 0 0 0 3px rgba(0, 191, 166, 0.2) !important;
    }
    .chat-send-button-fresh:hover {
        background-color: #00A794 !important;
    }

    /* Typing Indicator Animation */
    .typing-dot {
      width: 8px;
      height: 8px;
      margin: 0 3px;
      background-color: #A0AEC0; /* A neutral dot color */
      border-radius: 50%;
      opacity: 0.4;
      animation: typingAnimation 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(1) {
      animation-delay: 0s;
    }
    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes typingAnimation {
      0%, 100% {
        opacity: 0.4;
        transform: scale(0.85);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `}</style>
);

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  // Ensure styles are available; this check might be redundant if TS ensures freshChatboxStyles is initialized
  if (!freshChatboxStyles.typingIndicatorBubble || !freshChatboxStyles.typingIndicatorDotContainer) {
    return null; // Or some fallback UI
  }
  return (
    <div style={freshChatboxStyles.typingIndicatorBubble}>
      <div style={freshChatboxStyles.botIcon}>
        <span role="img" aria-label="robot-typing">🤖</span>
      </div>
      <div style={freshChatboxStyles.typingIndicatorDotContainer}>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    </div>
  );
};


const Chatbox: React.FC<ChatboxProps> = ({ onClose }) => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const bearerToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGFtdHJ1bmd0aW5weTM2M0BnbWFpbC5jb20iLCJpYXQiOjE3NDg1NTQxNzMsImV4cCI6MTc0ODY0MDU3M30.iMpmzg_aK1QobE-M-Pahzkyfgv8BrzxOQQFlN9iUTVU";
      const modelName = "llama2:7b";

      const requestPayload = {
        userMessage: currentInput,
        model: modelName,
      };

      const response = await axios.post<string>(
        'http://localhost:8080/api/v1/chat/send',
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`,
          },
        }
      );

      let botReplyText: string;
      if (typeof response.data === 'string') {
        botReplyText = response.data;
      } else {
        botReplyText = "Sorry, I received an unexpected response format.";
        console.error("Unexpected API response format:", response.data);
      }

      const botReply: Message = { sender: 'bot', text: botReplyText };
      setMessages(prev => [...prev, botReply]);

    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessageText = "Sorry, the AI assistant is currently unavailable. Please try again later.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (typeof error.response.data === 'string' && error.response.data.length < 200) {
            errorMessageText = `Error: ${error.response.data}`;
          } else {
            errorMessageText = `Error: Could not connect to the AI assistant (Status: ${error.response.status}).`;
          }
        } else if (error.request) {
          errorMessageText = "Error: No response from the AI assistant. Please check your connection.";
        }
      }

      const errorMessage: Message = { sender: 'bot', text: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={freshChatboxStyles.container}>
        <div style={freshChatboxStyles.header}>
          <span role="img" aria-label="chat-icon" style={{ marginRight: '10px', fontSize: '22px', color: '#00BFA6' }}>💬</span>
          AI Assistant
          <button
            onClick={onClose}
            style={freshChatboxStyles.closeButton}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
        <div style={freshChatboxStyles.messagesContainer} className="webkit-scrollbar-fresh">
          {messages.map((msg, index) => (
            <div key={index} style={freshChatboxStyles.messageBubble(msg.sender)}>
              {msg.sender === 'bot' && (
                <div style={freshChatboxStyles.botIcon}>
                  <span role="img" aria-label="robot">🤖</span>
                </div>
              )}
              <div style={freshChatboxStyles.messageText(msg.sender)}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div style={freshChatboxStyles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={freshChatboxStyles.inputField}
            className="chat-input-field"
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            style={freshChatboxStyles.sendButton}
            className="chat-send-button-fresh"
            aria-label="Send message"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbox;