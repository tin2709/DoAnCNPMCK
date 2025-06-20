import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

// --- ICONS TỪ REACT-ICONS ---
import {
  FiHome,
  FiLogOut,
  FiAlertCircle,
  FiX,
  FiFileText, // Icon cho các nút export
  FiEye,      // Icon cho hành động "Xem"
  FiPackage   // Icon cho modal
} from 'react-icons/fi';

// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU CHO ĐƠN HÀNG ---
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
  date: string; // Giữ dạng string từ API, sẽ format khi hiển thị
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

// --- COMPONENT MODAL MỚI CHO CHI TIẾT ĐƠN HÀNG ---
interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FiPackage />
            Chi tiết Đơn hàng #{order.id}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6">
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
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
export default function OrderManagement() {
  // --- STATE MANAGEMENT ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE CHO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const navigate = useNavigate();

  // --- LOGIC FETCH DỮ LIỆU ---
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
      setOrders(response.data);
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

  // --- USEEFFECT HOOK ---
  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser && currentUser.accessToken && currentUser.id) {
      fetchOrders(currentUser.accessToken, currentUser.id);
    }
  }, [getAuthInfo, fetchOrders]);


  // --- HÀM XỬ LÝ SỰ KIỆN ---
  const handleLogout = () => {
    localStorage.removeItem('userLoginInfo');
    Swal.fire({ icon: 'success', title: 'Đăng xuất thành công!', showConfirmButton: false, timer: 1500 });
    navigate("/login");
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Hàm tiện ích để lấy class màu cho trạng thái
  const getStatusClass = (statusName: string) => {
    const name = statusName.toLowerCase();
    if (name.includes('đã thanh toán') || name.includes('hoàn thành')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    }
    if (name.includes('chờ thanh toán') || name.includes('đang xử lý')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    }
    if (name.includes('từ chối') || name.includes('hủy')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };


  // --- RENDER GIAO DIỆN ---
  if (loading && orders.length === 0) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Lịch sử Đơn hàng
          </h1>
          <div className="flex items-center gap-6">
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiLogOut />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="mb-4">
          <a href="/" className="flex items-center text-sm text-gray-500 hover:text-blue-600">
            <FiHome className="mr-2" />
            <span>Trang chủ</span>
          </a>
        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center" role="alert">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2"/>
              <span className="block sm:inline">{error}</span>
            </div>
            <button onClick={() => setError(null)}><FiX/></button>
          </div>
        )}

        {/* Khu vực controls */}
        <div className="flex flex-wrap items-center justify-end gap-4 mb-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FiFileText/> Xuất PDF
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FiFileText/> Xuất Excel
          </button>
        </div>

        {/* Table */}
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
              {loading && (
                <tr><td colSpan={5} className="text-center py-4">Đang tải...</td></tr>
              )}
              {!loading && orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} onClick={() => handleRowClick(order)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">{order.total.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.statusName)}`}>
                            {order.statusName}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1 mx-auto">
                        <FiEye />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Bạn chưa có đơn hàng nào.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- Render Modal --- */}
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}