import React, { useEffect, useState } from 'react';

//======================================================================
// 1. ĐỊNH NGHĨA TYPES VÀ HẰNG SỐ (Không đổi)
//======================================================================

const API_ROOT = 'http://localhost:8080/api';

interface InvoiceRequest {
  id: number;
  orderId: number;
  userName: string;
  statusId: number;
  statusName: string;
  createdAt: string; // createdAt là string để khớp với JSON trả về
}

const INVOICE_STATUS_OPTIONS = [
  { id: 1, label: 'Chờ xét duyệt', color: 'bg-yellow-500' },
  { id: 2, label: 'Từ chối', color: 'bg-red-500' },
  { id: 3, label: 'Chờ thanh toán', color: 'bg-blue-500' },
  { id: 4, label: 'Đã thanh toán', color: 'bg-green-500' },
];

const EDITABLE_STATUS_OPTIONS = INVOICE_STATUS_OPTIONS.filter((opt) =>
  [1, 2, 3].includes(opt.id)
);

//======================================================================
// 2. CÁC HÀM GỌI API (Không đổi)
//======================================================================

async function fetchInvoiceRequests(token: string): Promise<InvoiceRequest[]> {
  const response = await fetch(`${API_ROOT}/invoice-requests`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Không thể tải danh sách yêu cầu.');
  return response.json();
}

async function updateInvoiceRequestStatus(
  requestId: number,
  statusId: number,
  token: string
): Promise<InvoiceRequest> {
  const response = await fetch(`${API_ROOT}/invoice-requests/${requestId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ statusId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái.');
  }
  // Bây giờ API sẽ trả về JSON hợp lệ, có thể parse được
  return response.json();
}

//======================================================================
// 3. COMPONENT REACT (Tối ưu hóa logic xử lý)
//======================================================================

const InvoiceRequestPage: React.FC = () => {
  const [data, setData] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<number | null>(null);

  // Hàm tải dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await fetchInvoiceRequests(token);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Hàm xử lý khi bấm nút "Đổi trạng thái"
  const handleEditClick = (request: InvoiceRequest) => {
    setEditingId(request.id);
    setEditStatus(request.statusId);
  };

  // Hàm xử lý khi bấm nút "Hủy"
  const handleCancelClick = () => {
    setEditingId(null);
    setEditStatus(null);
  };

  // <<< HÀM QUAN TRỌNG NHẤT: XỬ LÝ LƯU THAY ĐỔI >>>
  const handleSaveClick = async (requestId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token || editStatus === null) {
      setError('Thông tin không hợp lệ để cập nhật.');
      return;
    }

    // Xóa các thông báo cũ trước khi gọi API
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Gọi API để cập nhật. Hàm này giờ sẽ chạy thành công
      const updatedRequest = await updateInvoiceRequestStatus(requestId, editStatus, token);

      // 2. Cập nhật lại state `data` với item mới nhất
      // React sẽ tự động render lại giao diện ngay lập tức
      setData(prevData =>
        prevData.map(item =>
          item.id === updatedRequest.id ? updatedRequest : item
        )
      );

      // 3. Hiển thị thông báo thành công
      setSuccessMessage('Cập nhật trạng thái thành công!');

      // 4. Thoát khỏi chế độ chỉnh sửa
      setEditingId(null);

    } catch (err: any) {
      // Nếu API vẫn có lỗi (ví dụ: lỗi nghiệp vụ 400, 403), hiển thị lỗi
      setError(err.message);
    } finally {
      // 5. Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  if (loading) return <div className="p-4 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản lý Yêu cầu Hóa đơn</h1>

      {/* Hiển thị thông báo */}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded transition-opacity">{error}</div>}
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded transition-opacity">{successMessage}</div>}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          {/* ... thead giữ nguyên ... */}
          <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tên người dùng</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ngày tạo</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Hành động</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {data.map((item) => {
            const statusInfo = INVOICE_STATUS_OPTIONS.find(opt => opt.id === item.statusId);
            const isEditing = editingId === item.id;

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {/* createdAt giờ là string, có thể dùng trực tiếp */}
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {isEditing ? (
                    <select
                      className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={editStatus ?? ''}
                      onChange={(e) => setEditStatus(Number(e.target.value))}
                    >
                      {EDITABLE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusInfo?.color || 'bg-gray-400'}`}>
                      {item.statusName}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                  {isEditing ? (
                    <>
                      <button onClick={() => handleSaveClick(item.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Lưu</button>
                      <button onClick={handleCancelClick} className="text-gray-600 hover:text-gray-900">Hủy</button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditClick(item)}
                      disabled={item.statusId === 4}
                      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Đổi trạng thái
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceRequestPage;