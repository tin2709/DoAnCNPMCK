import React, { useEffect, useState } from 'react';

//======================================================================
// 1. ĐỊNH NGHĨA TYPES VÀ HẰNG SỐ
//======================================================================

const API_ROOT = 'http://localhost:8080/api';

interface InvoiceRequest {
  id: number;
  orderId: number;
  userName: string;
  statusId: number;
  statusName: string;
  createdAt: string;
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
// 2. CÁC HÀM GỌI API
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
  return response.json();
}

//======================================================================
// 3. COMPONENT REACT
//======================================================================

const InvoiceRequestPage: React.FC = () => {
  const [data, setData] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<number | null>(null);

  // ADDED: State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        // Sắp xếp yêu cầu mới nhất lên đầu
        const sortedData = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setData(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ADDED: useEffect để reset trang về 1 khi người dùng đổi số mục/trang
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // ADDED: Logic tính toán các mục cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

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

  // Hàm xử lý lưu thay đổi
  const handleSaveClick = async (requestId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token || editStatus === null) {
      setError('Thông tin không hợp lệ để cập nhật.');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const updatedRequest = await updateInvoiceRequestStatus(requestId, editStatus, token);
      setData(prevData =>
        prevData.map(item =>
          item.id === updatedRequest.id ? updatedRequest : item
        )
      );
      setSuccessMessage('Cập nhật trạng thái thành công!');
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
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

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded transition-opacity">{error}</div>}
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded transition-opacity">{successMessage}</div>}

      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
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
            {/* MODIFIED: Render `currentItems` thay vì `data` */}
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const statusInfo = INVOICE_STATUS_OPTIONS.find(opt => opt.id === item.statusId);
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
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
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Không có yêu cầu nào.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        {/* ADDED: Giao diện điều khiển phân trang */}
        {totalPages > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> - <span className="font-medium">{Math.min(indexOfLastItem, data.length)}</span> trên <span className="font-medium">{data.length}</span> yêu cầu
                </p>
                <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="p-1 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
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

export default InvoiceRequestPage;