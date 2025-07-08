import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';

// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU MỚI (KHỚP VỚI DTO CỦA BACKEND) ---

interface ProductInfo {
  productName: string;
}

interface OrderDetailInfo {
  quantity: number;
  price: number;
  product: ProductInfo;
}

// Đây là interface chính cho mỗi đơn hàng nhận về từ API
interface ApiOrderSummary {
  id: number;
  total: number;
  date: string;
  statusId: number;
  statusName: string;
  customerName: string;
  orderDetails: OrderDetailInfo[];
}

// Kiểu MappedOrder giờ có thể được đơn giản hóa hoặc giữ nguyên nếu bạn muốn
// Ở đây, ta giữ nguyên để không phải sửa nhiều ở JSX
interface MappedOrder {
  id: number;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  statusName: string;
  statusId: number;
  orderDate: string;
  orderDetails: OrderDetailInfo[];
}

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MappedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentProcessingOrderId, setPaymentProcessingOrderId] = useState<number | null>(null);
  const [hoveredOrderId, setHoveredOrderId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      Swal.fire('Lỗi', 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', 'error');
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<ApiOrderSummary[]>('http://localhost:8080/api/orders/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Mapping giờ trở nên đơn giản hơn vì DTO đã phẳng hơn
        const mappedData: MappedOrder[] = response.data.map((item) => ({
          id: item.id,
          orderCode: `DH-${item.id.toString().padStart(5, '0')}`,
          customerName: item.customerName,
          totalAmount: item.total,
          statusName: item.statusName,
          statusId: item.statusId,
          orderDate: item.date,
          orderDetails: item.orderDetails || [],
        }));
        setOrders(mappedData);
      } catch (error: any) {
        let errorMessage = "Không thể tải danh sách đơn hàng.";
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        }
        Swal.fire('Lỗi', errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // --- Hàm handlePayment không đổi ---
  const handlePayment = async (order: MappedOrder) => {
    setPaymentProcessingOrderId(order.id);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      Swal.fire('Lỗi xác thực', 'Không tìm thấy mã truy cập. Vui lòng đăng nhập lại.', 'error');
      setPaymentProcessingOrderId(null);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/vnpay/create-order",
        {
          amount: order.totalAmount,
          orderId: order.id,
          bankCode: ""
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const { paymentUrl } = response.data;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ máy chủ.");
      }

    } catch (err: any) {
      let errorMessageToShow = "Đã xảy ra lỗi trong quá trình khởi tạo thanh toán.";
      if (axios.isAxiosError(err)) {
        errorMessageToShow = err.response?.data?.message || `Lỗi máy chủ: ${err.response?.status}`;
      } else if (err instanceof Error) {
        errorMessageToShow = err.message;
      }
      Swal.fire('Thanh toán thất bại', errorMessageToShow, 'error');
      setPaymentProcessingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'>
      <h1 className="text-3xl font-bold mb-6">Lịch sử Đơn hàng</h1>

      <div className='bg-white rounded-lg shadow-md overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Mã Đơn</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Khách Hàng</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Tổng Tiền</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Trạng Thái</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Ngày Đặt</th>
          </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order.id}>
                <td className='px-6 py-4 text-sm font-medium text-gray-900'>{order.orderCode}</td>
                <td className='px-6 py-4 text-sm text-gray-600'>{order.customerName}</td>

                <td
                  className='px-6 py-4 text-sm font-semibold text-gray-600 relative'
                  onMouseEnter={() => setHoveredOrderId(order.id)}
                  onMouseLeave={() => setHoveredOrderId(null)}
                >
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}

                  {hoveredOrderId === order.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 text-white rounded-lg shadow-lg z-10 text-xs">
                      <h4 className="font-bold border-b border-gray-600 pb-1 mb-2">Chi tiết sản phẩm</h4>
                      <ul className="space-y-1">
                        {order.orderDetails.map(detail => (
                          <li key={detail.id} className="flex justify-between">
                            {/* Truy cập tên sản phẩm qua detail.product.productName */}
                            <span className="truncate pr-2">{detail.product?.productName || 'N/A'} (x{detail.quantity})</span>
                            <span className="font-mono whitespace-nowrap">
                                {new Intl.NumberFormat('vi-VN').format(detail.price * detail.quantity)} đ
                              </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>

                <td className='px-6 py-4 text-sm'>
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full 
                      ${order.statusId === 4 ? 'bg-green-100 text-green-800' :
                      order.statusId === 2 ? 'bg-red-100 text-red-800' :
                        order.statusId === 3 ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                      {order.statusName}
                    </span>
                </td>
                <td className='px-6 py-4 text-sm text-gray-600'>
                  {order.orderDate ? format(parseISO(order.orderDate), 'dd/MM/yyyy HH:mm') : 'N/A'}
                </td>


              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-10 text-gray-500">
                Không có đơn hàng nào.
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;