import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Thêm logic đăng ký ở đây, ví dụ kiểm tra password trùng khớp, gọi API...
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!agreeTerms) {
      alert('Bạn cần đồng ý với điều khoản sử dụng.');
      return;
    }
    // Thực hiện đăng ký
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Register Form */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Đăng ký tài khoản</h1>
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
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="agreeTerms"
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
              />
              <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">
                Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">điều khoản sử dụng</a>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 rounded-md hover:bg-green-700 transition duration-200 !rounded-button whitespace-nowrap cursor-pointer"
              disabled={!agreeTerms}
            >
              Đăng ký
            </button>
          </form>
          <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
  Bạn đã có tài khoản?{' '}
  <Link to="/login" className="text-blue-600 hover:underline">
    Đăng nhập
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

export default Register;
