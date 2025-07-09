// src/pages/User/OrderManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

// --- ICONS TỪ REACT-ICONS ---
import {
  FiHome,
  FiLogOut,
  FiX,
  FiFileText,
  FiEye,
  FiPackage,
  FiSun,
  FiMoon,
  FiCreditCard,
  FiAlertCircle // Thêm icon này để hiển thị lỗi
} from 'react-icons/fi'
import Chatbox from '../Chatbox.tsx'; // (Điều chỉnh đường dẫn nếu cần)

// --- THƯ VIỆN XUẤT FILE ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ---
interface ProductInDetail {
  id: number;
  productName: string;
  image: string;
}
interface OrderDetail {
  id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product: ProductInDetail;
}
interface CreatedBy {
  id: number;
  username: string;
}
interface Order {
  id: number;
  total: number;
  statusName: string;
  date: string;
  createdBy: CreatedBy;
  orderDetails: OrderDetail[];
}
interface LoggedInUser {
  id: number;
  email: string;
  name: string;
  role: { id: number; roleName: string; };
  accessToken: string;
}

// --- COMPONENT MODAL CHI TIẾT ĐƠN HÀNG ---
interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}
const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3"><FiPackage />Chi tiết Đơn hàng #{order.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><FiX size={24} /></button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-sm"><strong>Người tạo:</strong> {order.createdBy.username}</div>
            <div className="text-sm"><strong>Ngày tạo:</strong> {new Date(order.date).toLocaleString('vi-VN')}</div>
            <div className="text-sm"><strong>Trạng thái:</strong> {order.statusName}</div>
            <div className="text-sm font-bold"><strong>Tổng tiền:</strong> {order.total.toLocaleString('vi-VN')} đ</div>
          </div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Các sản phẩm trong đơn:</h3>
          <div className="space-y-4">
            {order.orderDetails.map(detail => (
              <div key={detail.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <img src={detail.product.image} alt={detail.product.productName} className="h-16 w-16 object-cover rounded-md" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{detail.product.productName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Số lượng: {detail.quantity}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đơn giá: {detail.price.toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{detail.subtotal.toLocaleString('vi-VN')} đ</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500">Đóng</button>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [paymentProcessingOrderId, setPaymentProcessingOrderId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') return true;
    if (localStorage.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getAuthInfo = useCallback(() => {
    const userLoginInfoString = localStorage.getItem('userLoginInfo');
    if (!userLoginInfoString) {
      Swal.fire('Lỗi', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', 'error');
      navigate('/login');
      return null;
    }
    return JSON.parse(userLoginInfoString) as LoggedInUser;
  }, [navigate]);

  const fetchOrders = useCallback(async (token: string, userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8080/api/orders/user/${userId}`;
      const response = await axios.get<Order[]>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedOrders = response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(sortedOrders);
    } catch (err: any) {
      let errorMessage = "Không thể tải dữ liệu đơn hàng của bạn.";
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) errorMessage = "Bạn không có quyền xem tài nguyên này.";
        else if (err.response.data) errorMessage = err.response.data.message || err.response.data;
      }
      setError(errorMessage);
      Swal.fire('Lỗi', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser && currentUser.accessToken && currentUser.id) {
      fetchOrders(currentUser.accessToken, currentUser.id);
    }
  }, [getAuthInfo, fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handleExportPDF = async () => {
    if (orders.length === 0) {
      Swal.fire('Không có dữ liệu', 'Không có đơn hàng nào để xuất file PDF.', 'warning');
      return;
    }
    const doc = new jsPDF();
    try {
      const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
      const fontBlob = await fontResponse.arrayBuffer();
      const fontData = new Uint8Array(fontBlob);
      const fontBase64 = btoa(String.fromCharCode.apply(null, Array.from(fontData)));
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
      doc.text('Lịch sử Đơn hàng', 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [['Mã ĐH', 'Ngày tạo', 'Người tạo', 'Trạng thái', 'Tổng tiền (VNĐ)']],
        body: orders.map(o => [
          `#${o.id}`,
          new Date(o.date).toLocaleString('vi-VN'),
          o.createdBy.username,
          o.statusName,
          o.total.toLocaleString('vi-VN'),
        ]),
        styles: { font: 'Roboto', fontStyle: 'normal' },
        headStyles: { fontStyle: 'bold' }
      });
      doc.save('lich-su-don-hang.pdf');
    } catch (error) {
      console.error("Lỗi khi tạo PDF:", error);
      Swal.fire('Lỗi!', 'Không thể tạo file PDF. Vui lòng kiểm tra file font.', 'error');
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      Swal.fire('Không có dữ liệu', 'Không có đơn hàng nào để xuất file Excel.', 'warning');
      return;
    }
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    const worksheetData = orders.map(order => ({
      'Mã Đơn Hàng': order.id,
      'Ngày Tạo': new Date(order.date).toLocaleString('vi-VN'),
      'Người Tạo': order.createdBy.username,
      'Trạng Thái': order.statusName,
      'Tổng Tiền (VNĐ)': order.total,
    }));
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = { Sheets: { 'Đơn Hàng': ws }, SheetNames: ['Đơn Hàng'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    saveAs(data, 'lich-su-don-hang' + fileExtension);
  };

  const handleLogout = () => {
    localStorage.removeItem('userLoginInfo');
    Swal.fire({ icon: 'success', title: 'Đăng xuất thành công!', showConfirmButton: false, timer: 1500 });
    navigate("/login");
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handlePayment = async (order: Order, event: React.MouseEvent) => {
    event.stopPropagation();
    setPaymentProcessingOrderId(order.id);
    const authInfo = getAuthInfo();
    if (!authInfo || !authInfo.accessToken) {
      Swal.fire('Lỗi xác thực', 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.', 'error');
      setPaymentProcessingOrderId(null);
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-order",
        { amount: order.total, orderId: order.id, bankCode: "" },
        { headers: { Authorization: `Bearer ${authInfo.accessToken}` } }
      );
      const { paymentUrl } = response.data;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ máy chủ.");
      }
    } catch (err: any) {
      console.error("❌ Lỗi trong quá trình tạo yêu cầu thanh toán VNPay:", err);
      let errorMessageToShow = "Đã xảy ra lỗi trong quá trình khởi tạo thanh toán.";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessageToShow = err.response.data?.message || err.response.data?.error || `Lỗi máy chủ: ${err.response.status}`;
        } else if (err.request) {
          errorMessageToShow = "Lỗi mạng. Vui lòng kiểm tra kết nối.";
        }
      } else if (err.message) {
        errorMessageToShow = err.message;
      }
      Swal.fire('Thanh toán thất bại', errorMessageToShow, 'error');
      setPaymentProcessingOrderId(null);
    }
  };

  const getStatusClass = (statusName: string) => {
    const name = statusName.toLowerCase();
    if (name.includes('đã thanh toán') || name.includes('hoàn thành')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    if (name.includes('chờ thanh toán') || name.includes('đang xử lý')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    if (name.includes('từ chối') || name.includes('hủy')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const navItems = [
    { path: '/products', label: 'Sản phẩm' },
    { path: '/user', label: 'Người dùng' },
    { path: '/orders', label: 'Đơn hàng' },
  ];

  if (loading && orders.length === 0) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="relative" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 focus:outline-none transition-colors">
                <FiHome size={22} />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 top-full pt-2 w-48 z-40">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 ring-1 ring-black ring-opacity-5">
                    <ul>
                      {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <li key={item.path}>
                            <Link to={item.path} className={`block px-4 py-2 text-sm transition-colors ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Lịch sử Đơn hàng</h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              {isDarkMode ? <FiSun size={22} className="text-orange-400" /> : <FiMoon size={22} />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiLogOut /><span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* --- FIXED: Sửa khối hiển thị lỗi --- */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center" role="alert">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-4 mb-4">
          <button onClick={handleExportPDF} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500 flex items-center gap-2">
            <FiFileText/> Xuất PDF
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500 flex items-center gap-2">
            <FiFileText/> Xuất Excel
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hành động</th>
              </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td onClick={() => handleRowClick(order)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                    <td onClick={() => handleRowClick(order)} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white cursor-pointer">{order.total.toLocaleString('vi-VN')} đ</td>
                    <td onClick={() => handleRowClick(order)} className="px-6 py-4 whitespace-nowrap text-center cursor-pointer">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.statusName)}`}>
                            {order.statusName}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                      <div className="flex justify-center items-center gap-4">
                        <button onClick={() => handleRowClick(order)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                          <FiEye /><span>Xem</span>
                        </button>
                        {order.statusName.toLowerCase() === 'chờ thanh toán' && (
                          <button onClick={(e) => handlePayment(order, e)} disabled={paymentProcessingOrderId === order.id} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            <FiCreditCard /><span>{paymentProcessingOrderId === order.id ? 'Đang xử lý...' : 'Thanh toán'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Bạn chưa có đơn hàng nào.</td></tr>
              )}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> - <span className="font-medium">{Math.min(indexOfLastItem, orders.length)}</span> trên <span className="font-medium">{orders.length}</span> đơn hàng
                  </p>
                  <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={15}>15 / trang</option>
                  </select>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">
                      <span className="sr-only">Previous</span>
                      {'<'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-gray-900 dark:border-blue-400 dark:text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                        {pageNumber}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50">
                      <span className="sr-only">Next</span>
                      {'>'}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <OrderDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} order={selectedOrder}/>

      {!isChatOpen && (
        <button
          onClick={toggleChat}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
            borderRadius: '50%', backgroundColor: '#4299E1', color: 'white', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '28px', zIndex: 1000,
            transition: 'transform 0.2s ease-in-out',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open Chat"
        >
          💬
        </button>
      )}

      <div className={isChatOpen ? 'block' : 'hidden'}>
        <Chatbox onClose={toggleChat} />
      </div>
    </div>
  );
}