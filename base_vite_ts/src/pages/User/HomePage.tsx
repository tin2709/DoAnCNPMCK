// src/pages/User/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Chatbox from '../Chatbox.tsx'; // <<<<---- IMPORT THE CHATBOX COMPONENT (adjust path if needed)

// Import react-icons (giữ nguyên)
import {
  FiChevronDown, FiLogOut, FiBox, FiInfo, FiBarChart2,
  FiPhone, FiCalendar, FiUser, FiMail, FiFileText, FiDollarSign
} from 'react-icons/fi';

// Animation libraries (giữ nguyên)
import { OverPack } from 'rc-scroll-anim';
import QueueAnim from 'rc-queue-anim';

// --- INTERFACES (giữ nguyên từ câu trả lời trước) ---
interface LoggedInUser {
  id: number;
  email: string;
  name: string;
  role: { id: number; roleName: string; };
  accessToken: string;
}

interface Order {
  id: number;
  total: number;
  statusName: string;
  date: string;
  orderDetails: any[];
  createdBy: any;
}

interface RegularMenuItem {
  type: 'menu';
  key: string;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
}

interface DividerMenuItem {
  type: 'divider';
  key: string;
}

interface LogoutMenuItem {
  type: 'logout';
  key: string;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  danger: boolean;
}

type DropdownItem = RegularMenuItem | DividerMenuItem | LogoutMenuItem;

interface FormState {
  name: string;
  email: string;
  message: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  useEffect(() => {
    const userLoginInfoString = localStorage.getItem('userLoginInfo');
    if (userLoginInfoString) {
      const userData: LoggedInUser = JSON.parse(userLoginInfoString);
      setCurrentUser(userData);
    } else {
      console.error("Không tìm thấy thông tin đăng nhập. Đang chuyển hướng...");
      navigate('/login');
    }
  }, [navigate]);

  // --- useEffect MỚI ĐỂ KIỂM TRA VÀ HIỂN THỊ THÔNG BÁO ĐƠN HÀNG ---
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const notificationShown = sessionStorage.getItem('homePageNotificationShown');
    if (notificationShown === 'true') {
      return;
    }

    const checkOrderNotifications = async () => {
      try {
        const response = await axios.get<Order[]>(
          `http://localhost:8080/api/orders/user/${currentUser.id}`,
          {
            headers: { Authorization: `Bearer ${currentUser.accessToken}` }
          }
        );
        const orders = response.data;

        // BƯỚC 1: LỌC RIÊNG TỪNG LOẠI TRẠNG THÁI
        const rejectedOrders = orders.filter(order => order.statusName === 'Từ chối');
        const awaitingPaymentOrders = orders.filter(order => order.statusName === 'Chờ thanh toán');

        // BƯỚC 2: KIỂM TRA XEM CÓ GÌ ĐỂ THÔNG BÁO KHÔNG
        if (rejectedOrders.length === 0 && awaitingPaymentOrders.length === 0) {
          sessionStorage.setItem('homePageNotificationShown', 'true');
          return; // Không có gì để thông báo, thoát và đánh dấu
        }

        // BƯỚC 3: XÂY DỰNG NỘI DUNG THÔNG BÁO ĐỘNG
        let notificationHtml = '';
        if (rejectedOrders.length > 0) {
          notificationHtml += `<div class="text-left mb-2"><strong>Đơn hàng bị từ chối:</strong> ĐH #${rejectedOrders.map(o => o.id).join(', #')}</div>`;
        }
        if (awaitingPaymentOrders.length > 0) {
          notificationHtml += `<div class="text-left"><strong>Đơn hàng chờ thanh toán:</strong> ĐH #${awaitingPaymentOrders.map(o => o.id).join(', #')}</div>`;
        }

        const finalHtml = `
            ${notificationHtml}
            <br>
            Hãy kiểm tra trang <a href="/orders" class="font-bold text-blue-600 hover:underline">Lịch sử Đơn hàng</a>.
        `;

        // BƯỚC 4: HIỂN THỊ TOAST VỚI NỘI DUNG CHI TIẾT
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning', // Dùng icon warning sẽ phù hợp hơn
          iconColor: '#f59e0b', // Màu vàng
          title: `Bạn có thông báo mới về đơn hàng!`,
          html: finalHtml,
          showConfirmButton: false,
          showCloseButton: true,
          timer: 7000, // Tăng thời gian hiển thị lên một chút
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });

      } catch (error) {
        console.error("Lỗi khi kiểm tra thông báo đơn hàng:", error);
      } finally {
        sessionStorage.setItem('homePageNotificationShown', 'true');
      }
    };

    checkOrderNotifications();

  }, [currentUser]);


  // --- CÁC STATE VÀ LOGIC KHÁC GIỮ NGUYÊN ---
  const [renderBelowFold, setRenderBelowFold] = useState<boolean>(false);
  const [isManagementDropdownOpen, setIsManagementDropdownOpen] = useState<boolean>(false);
  const [contactForm, setContactForm] = useState<FormState>({ name: '', email: '', message: '' });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setRenderBelowFold(true); }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isManagementDropdownOpen && !(event.target as HTMLElement).closest('.management-dropdown-wrapper')) {
        setIsManagementDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isManagementDropdownOpen]);

  const greetingMessage = `Hello, ${currentUser?.name || 'User'}!`;

  const handleLogout = () => {
    localStorage.removeItem('userLoginInfo');
    Swal.fire({
      icon: 'success',
      title: 'Đăng xuất thành công!',
      showConfirmButton: false,
      timer: 1500
    });
    navigate("/login", { replace: true });
  };

  const managementMenuItems: RegularMenuItem[] = [
    {
      type: 'menu',
      key: 'products',
      icon: <FiBox />,
      label: 'Sản phẩm',
      onClick: () => {
        navigate('/products');
        setIsManagementDropdownOpen(false);
      }
    },
    {
      type: 'menu',
      key: 'orders',
      icon: <FiFileText />,
      label: 'Hóa đơn',
      onClick: () => {
        navigate('/orders');
        setIsManagementDropdownOpen(false);
      },
    }
  ];

  const managementDropdownItems: DropdownItem[] = [
    ...managementMenuItems,
    { type: 'divider', key: 'divider-logout' },
    {
      type: 'logout',
      key: 'logout',
      icon: <FiLogOut />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const onContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const onContactFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin!', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      Swal.fire('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ!', 'error');
      return;
    }
    setTimeout(() => {
      Swal.fire('Thành công', 'Tin nhắn của bạn đã được gửi!', 'success');
      setContactForm({ name: '', email: '', message: '' });
      formRef.current?.reset();
    }, 500);
  };

  const aboutUsImageUrl = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Đang xác thực...</div>;
  }

  // --- PHẦN GIAO DIỆN JSX (GIỮ NGUYÊN) ---
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-blue-800 text-white shadow-md z-50 py-4 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider">InvoicePro</div>
        <nav className="flex items-center space-x-6">
          <a href="#about" className="hover:text-blue-200 transition-colors">About Us</a>
          <a href="#features" className="hover:text-blue-200 transition-colors">Features</a>
          <a href="#contact" className="hover:text-blue-200 transition-colors">Contact</a>

          <div className="relative management-dropdown-wrapper">
            <button
              className="flex items-center space-x-1 py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => setIsManagementDropdownOpen(!isManagementDropdownOpen)}
            >
              <span>Management</span>
              <FiChevronDown className={`ml-1 transition-transform ${isManagementDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isManagementDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg z-20 overflow-hidden">
                {managementDropdownItems.map(item => {
                  if (item.type === 'divider') {
                    return <hr key={item.key} className="border-t border-gray-200 my-1" />;
                  }
                  return (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 ${
                        item.type === 'logout' && item.danger ? 'text-red-600' : ''
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <span className="text-white ml-4">{greetingMessage}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-blue-700 transition-colors"
            title="Logout"
          >
            <FiLogOut className="text-xl" />
          </button>
        </nav>
      </header>

      {/* Main Content (Giữ nguyên không đổi) */}
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center py-24 px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Streamline Your Billing. Manage Invoices with Ease.</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 opacity-90">
            InvoicePro empowers businesses to create, track, and manage invoices efficiently, ensuring smooth financial operations and timely payments.
          </p>
          <a href="#about" className="inline-block bg-white text-blue-700 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-all shadow-lg">
            Learn More
          </a>
        </section>

        {renderBelowFold ? (
          <>
            {/* About Section */}
            <section id="about" className="py-16 px-6 bg-gray-100">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                  <FiInfo className="inline-block mr-3 text-blue-600" />About InvoicePro
                </h2>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src={aboutUsImageUrl}
                      alt="Invoice management software interface"
                      className="w-full h-auto max-w-md mx-auto rounded-lg shadow-xl"
                      loading="lazy"
                    />
                  </div>
                  <div className="order-1 md:order-2 text-lg text-gray-700 space-y-6">
                    <p>InvoicePro is a comprehensive solution designed to simplify the complex world of invoicing. Our platform helps businesses of all sizes automate their billing processes, reduce manual errors, and improve cash flow.</p>
                    <p>We focus on providing intuitive tools for invoice generation, payment tracking, and robust reporting, giving you full control and visibility over your financial transactions.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <OverPack id="features" className="py-16 px-6 bg-white" playScale={0.2}>
              <div key="features-content" className="max-w-6xl mx-auto">
                <QueueAnim key="features-anim" type={['bottom', 'top']} leaveReverse>
                  <h2 key="title" className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                    <FiDollarSign className="inline-block mr-3 text-green-600" />Key Features
                  </h2>
                  <div key="cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiFileText className="text-5xl text-blue-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Easy Invoice Creation</h3>
                      <p className="text-gray-600 text-center">Generate professional invoices quickly with customizable templates and automated calculations.</p>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiCalendar className="text-5xl text-yellow-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Real-time Payment Tracking</h3>
                      <p className="text-gray-600 text-center">Monitor payment statuses, send reminders, and keep a clear record of all transactions.</p>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiBarChart2 className="text-5xl text-purple-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Comprehensive Analytical Reports</h3>
                      <p className="text-gray-600 text-center">Gain insights into your sales, outstanding payments, and financial performance with detailed reports.</p>
                    </div>
                  </div>
                </QueueAnim>
              </div>
            </OverPack>

            {/* Contact Section */}
            <section id="contact" className="py-16 px-6 bg-gray-100">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800">
                  <FiPhone className="inline-block mr-3 text-red-600" />Contact Us
                </h2>
                <p className="text-lg text-gray-600 text-center mb-12">Have questions or need support? Reach out to our team.</p>
                <form ref={formRef} onSubmit={onContactFormSubmit} className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={onContactFormChange}
                          className="pl-10 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Your Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={contactForm.email}
                          onChange={onContactFormChange}
                          className="pl-10 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={contactForm.message}
                      onChange={onContactFormChange}
                      className="p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Type your message here..."
                      required
                    ></textarea>
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white font-bold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Placeholders for below-fold content */}
            <div className="h-96 bg-gray-200 animate-pulse flex items-center justify-center text-gray-500 text-xl">Loading About Section...</div>
            <div className="h-80 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-xl">Loading Features Section...</div>
            <div className="h-96 bg-gray-200 animate-pulse flex items-center justify-center text-gray-500 text-xl">Loading Contact Form...</div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} InvoicePro. All rights reserved.
      </footer>
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4299E1', // Màu xanh lam
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            zIndex: 1000,
            transition: 'transform 0.2s ease-in-out, background-color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open Chat"
        >
          💬
        </button>
      )}

      <div className={isChatOpen ? 'block' : 'hidden'}>
        <Chatbox
          onClose={toggleChat}
        />
      </div>


    </div>
  );
};

export default HomePage;