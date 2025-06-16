// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGoogle, FaApple } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const App: React.FC = () => {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [rememberMe, setRememberMe] = useState(false);
const navigate = useNavigate();
navigate("/");

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
try {
    const response = await fetch("http://localhost:8080/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      const data = await response.json();
      // Xử lý đăng nhập thành công (ví dụ: lưu token, chuyển trang, ...)
      alert("Đăng nhập thành công!");
      // Ví dụ: chuyển sang trang dashboard
      // navigate("/dashboard");
    } else {
      const error = await response.text();
      alert(error || "Đăng nhập thất bại!");
    }
  } catch (err) {
    alert("Lỗi kết nối tới server!");
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
src=""
alt="Cute pets illustration"
className="w-full h-full object-contain object-top"
/>
</div>
</div>
</div>
);
};
export default App
