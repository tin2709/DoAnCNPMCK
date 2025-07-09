import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';

// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ---
interface ProductInfo {
  productName: string;
}

interface OrderDetailInfo {
  quantity: number;
  price: number;
  product: ProductInfo;
}

interface ApiOrderSummary {
  id: number;
  total: number;
  date: string;
  statusId: number;
  statusName: string;
  customerName: string;
  orderDetails: OrderDetailInfo[];
}

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
  const [hoveredOrderId, setHoveredOrderId] = useState<number | null>(null);

  // ADDED: State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Mặc định 10 đơn hàng mỗi trang

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
        // Sắp xếp đơn hàng mới nhất lên đầu
        const sortedOrders = mappedData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(sortedOrders);
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

  // ADDED: useEffect để reset về trang 1 khi người dùng thay đổi số mục/trang
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // ADDED: Logic tính toán các đơn hàng cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

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

      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className="overflow-x-auto">
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
            {/* MODIFIED: Render `currentOrders` thay vì `orders` */}
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
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
                          {order.orderDetails.map((detail, index) => (
                            <li key={index} className="flex justify-between">
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
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  Không có đơn hàng nào.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>

        {/* ADDED: Giao diện điều khiển phân trang */}
        {totalPages > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> - <span className="font-medium">{Math.min(indexOfLastItem, orders.length)}</span> trên <span className="font-medium">{orders.length}</span> đơn hàng
                </p>
                <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="p-1 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Previous</span>
                    {'<'}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                    <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                      {pageNumber}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                    <span className="sr-only">Next</span>
                    {'>'}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;