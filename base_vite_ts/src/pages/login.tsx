// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGoogle, FaApple } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Đã sửa lỗi ở đây
import Swal from 'sweetalert2'; // Import SweetAlert2

// Đảm bảo bạn đã cài đặt axios: npm install axios
import axios from 'axios';

// Định nghĩa kiểu dữ liệu cho phản hồi từ API để dễ dàng truy cập thuộc tính
interface Role {
  id: number;
  roleName: string;
}

interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: Role;
  password?: string; // Mật khẩu thường không nên được trả về, nhưng nếu có thì thêm vào
  active: boolean;
  accessToken: string; // Đảm bảo trường này có trong DTO của Spring Boot khi login thành công
}

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post<UserResponse>("http://localhost:8080/api/auth/login", {
        email: email,
        password: password,
      });

      const data = response.data; // Dữ liệu phản hồi (chỉ khi đăng nhập thành công và tài khoản active)
      const accessToken = response.data.accessToken;

      // Không cần kiểm tra `data.active` ở đây nữa, vì backend đã xử lý và ném lỗi 403 nếu bị chặn.
      // Nếu đến được đây, nghĩa là tài khoản active và đăng nhập thành công.

      localStorage.setItem('userLoginInfo', JSON.stringify(data));
      localStorage.setItem('accessToken', accessToken);

      Swal.fire({
        icon: 'success',
        title: 'Đăng nhập thành công!',
        text: 'Chào mừng bạn trở lại!',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        const userRole = data.role?.roleName;

        if (userRole === "ADMIN") {
          navigate("/admin");
        } else if (userRole === "USER") {
          navigate("/user");
        } else {
          navigate("/user");
        }
      });

    } catch (error: any) {
      let errorMessage = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.";

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          // Lỗi từ server: 401 Unauthorized (sai email/mật khẩu)
          errorMessage = error.response.data || "Sai email hoặc mật khẩu.";
        } else if (error.response.status === 403) {
          // Lỗi từ server: 403 Forbidden (tài khoản bị chặn)
          Swal.fire({
            icon: 'warning',
            title: 'Tài khoản bị chặn!',
            text: error.response.data || 'Tài khoản của bạn đã bị quản trị viên chặn. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.',
            confirmButtonText: 'Đóng'
          });
          // Xóa thông tin đăng nhập đã lưu trong localStorage nếu có
          localStorage.removeItem('userLoginInfo');
          localStorage.removeItem('accessToken');
          return; // Dừng hàm tại đây, không hiển thị thông báo lỗi chung
        } else if (error.response.status === 400) {
          errorMessage = error.response.data || "Dữ liệu gửi lên không hợp lệ.";
        } else {
          errorMessage = `Lỗi từ server: ${error.response.status} - ${error.response.data || error.message}`;
        }
      } else {
        // Lỗi mạng hoặc lỗi khác không phải từ axios
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.";
        console.error("Login API call error:", error);
      }

      // Chỉ hiển thị Swal lỗi chung nếu chưa có Swal nào được hiển thị (ví dụ: Swal cảnh báo tài khoản bị chặn)
      if (!Swal.isVisible()) {
        Swal.fire({
          icon: 'error',
          title: 'Đăng nhập thất bại!',
          text: errorMessage,
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Đăng nhập</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-2">Địa chỉ email</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-2">Mật khẩu</label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">Ghi nhớ đăng nhập</label>
              </div>
              <Link to="/showSp" className="text-sm text-blue-600 hover:underline">Quên mật khẩu</Link>
            </div>
            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 rounded-md hover:bg-green-700 transition duration-200 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Đăng nhập
            </button>
          </form>
          <div className="mt-8">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-300 w-full"></div>
              <div className="bg-gray-50 px-4 text-sm text-gray-500 absolute">Hoặc</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 !rounded-button whitespace-nowrap cursor-pointer">
                <FaGoogle className="text-red-500 mr-2" />
                Đăng nhập với Google
              </button>
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 !rounded-button whitespace-nowrap cursor-pointer">
                <FaApple className="text-black mr-2" />
                Đăng nhập với Apple
              </button>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Bạn chưa có tài khoản?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                Đăng kí
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side - Illustration */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center p-12 relative">
        <div className="w-full h-full absolute overflow-hidden">
          <img
            src="https://readdy.ai/api/search-image?query=Adorable%20illustration%20of%20an%20orange%20tabby%20kitten%20and%20a%20beagle%20puppy%20sitting%20side%20by%20side%2C%20drawn%20in%20a%20cute%20sticker%20style%20with%20white%20outline.%20The%20illustration%20has%20a%20clean%20minimalist%20background%20with%20soft%20shadows%2C%20perfect%20for%20a%20pet-themed%20login%20page.%20The%20animals%20have%20expressive%20eyes%20and%20friendly%20expressions.&width=800&height=1024&seq=pet123&orientation=portrait"
            alt="Cute pets illustration"
            className="w-full h-full object-contain object-top"
          />
        </div>
      </div>
    </div>
  );
};
export default App;