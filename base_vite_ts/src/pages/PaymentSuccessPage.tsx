// src/pages/PaymentSuccessPage.tsx

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Đang xác nhận thanh toán của bạn, vui lòng đợi...');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const vnp_ResponseCode = queryParams.get('vnp_ResponseCode');
    const vnp_TxnRef = queryParams.get('vnp_TxnRef');
    const token = localStorage.getItem('accessToken');

    // --- Các bước kiểm tra ban đầu (giữ nguyên) ---
    if (!token) {
      setStatus('error');
      setMessage('Lỗi xác thực. Vui lòng đăng nhập lại và thử lại.');
      return;
    }
    if (!vnp_ResponseCode && !vnp_TxnRef) {
      Swal.fire('Giao dịch bị hủy', 'Bạn đã hủy giao dịch thanh toán.', 'warning');
      navigate('/orders');
      return;
    }

    let orderId: string | null = null;
    if (vnp_TxnRef) {
      orderId = vnp_TxnRef.split('_')[0];
    }

    // --- Bắt đầu luồng xử lý chính ---
    if (vnp_ResponseCode === '00' && orderId) {
      const processSuccessfulPayment = async (orderIdStr: string) => {
        try {
          const numericOrderId = parseInt(orderIdStr, 10);

          // =========================================================================
          // SỬA ĐỔI CHÍNH: Bỏ bước GET không cần thiết, gọi trực tiếp 2 API PUT
          // Sử dụng Promise.all để hai yêu cầu được gửi đi đồng thời, tăng hiệu suất.
          // =========================================================================
          await Promise.all([
            // API 1: Cập nhật trạng thái của Order
            axios.put(
              'http://localhost:8080/api/orders/update',
              {
                orderId: numericOrderId,
                statusId: 4 // Cập nhật thành "Đã thanh toán"
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            ),

            // API 2: Cập nhật trạng thái của InvoiceRequest bằng API mới
            axios.put(
              `http://localhost:8080/api/invoice-requests/by-order/${numericOrderId}/status`, // <-- SỬ DỤNG API MỚI
              {
                statusId: 4 // Cập nhật thành "Đã thanh toán"
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            )
          ]);

          // Cập nhật giao diện khi cả hai API đều thành công
          setStatus('success');
          setMessage(`Thanh toán cho đơn hàng #${orderIdStr} thành công! Mọi thứ đã được cập nhật.`);

          // Tự động chuyển hướng sau 3 giây
          setTimeout(() => navigate('/orders'), 3000);

        } catch (error: any) {
          const errorMessage = `Lỗi khi xử lý sau thanh toán: ${error.response?.data?.message || error.message}.`;
          setStatus('error');
          setMessage(errorMessage);
          Swal.fire('Lỗi!', errorMessage, 'error');
        }
      };

      processSuccessfulPayment(orderId);

    } else {
      // Xử lý giao dịch thất bại (giữ nguyên)
      const errorCode = queryParams.get('vnp_ResponseCode');
      const errorMessage = `Giao dịch thất bại. Mã lỗi: ${errorCode}. Vui lòng thử lại.`;
      setStatus('error');
      setMessage(errorMessage);
      Swal.fire('Thanh toán thất bại!', errorMessage, 'error');
    }
  }, [location, navigate]);


  // --- Phần render JSX (giữ nguyên) ---
  const getStatusColor = () => {
    if (status === 'success') return 'text-green-600';
    if (status === 'error') return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-lg shadow-xl text-center">
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'processing' && 'Đang xử lý...'}
          {status === 'success' && 'Thanh toán thành công!'}
          {status === 'error' && 'Đã xảy ra lỗi!'}
        </h1>
        <p className="text-gray-600">{message}</p>
        {status !== 'processing' && (
          <button
            onClick={() => navigate('/orders')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Quay về trang quản lý đơn hàng
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;