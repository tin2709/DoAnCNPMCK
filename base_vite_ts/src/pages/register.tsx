import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

// Khai báo để TypeScript hiểu các đối tượng của Google Dịch trên `window`
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const Register: React.FC = () => {
  const navigate = useNavigate();

  // ----- TOÀN BỘ LOGIC FORM VÀ VALIDATION CỦA BẠN GIỮ NGUYÊN -----
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  type FormErrors = {
    [K in keyof typeof formData]?: string;
  } & { api?: string };
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (name: keyof typeof formData, value: string | boolean): string => {
    switch (name) {
      case 'username':
        if (typeof value !== 'string' || !value.trim()) return 'Tên người dùng không được để trống.';
        if (value.trim().length < 3) return 'Tên người dùng phải có ít nhất 3 ký tự.';
        break;
      case 'email':
        if (typeof value !== 'string' || !value.trim()) return 'Địa chỉ email không được để trống.';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Địa chỉ email không hợp lệ.';
        break;
      case 'password':
        if (typeof value !== 'string' || !value) return 'Mật khẩu không được để trống.';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
        break;
      case 'confirmPassword':
        if (typeof value !== 'string' || !value) return 'Xác nhận mật khẩu không được để trống.';
        if (value !== formData.password) return 'Mật khẩu xác nhận không khớp.';
        break;
      case 'agreeTerms':
        if (typeof value !== 'boolean' || !value) return 'Bạn cần đồng ý với điều khoản sử dụng.';
        break;
    }
    return '';
  };

  const validateAll = () => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    const fieldName = id as keyof typeof formData;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
    setErrors(prev => {
      const updatedErrors = { ...prev };
      const err = validateField(fieldName, fieldValue);
      if (err) { updatedErrors[fieldName] = err; } else { delete updatedErrors[fieldName]; }
      if (fieldName === 'password' || fieldName === 'confirmPassword') {
        const currentPassword = fieldName === 'password' ? (fieldValue as string) : formData.password;
        const currentConfirmPassword = fieldName === 'confirmPassword' ? (fieldValue as string) : formData.confirmPassword;
        const passwordErr = validateField('password', currentPassword);
        if (passwordErr) updatedErrors.password = passwordErr; else delete updatedErrors.password;
        const confirmPasswordErr = validateField('confirmPassword', currentConfirmPassword);
        if (confirmPasswordErr) updatedErrors.confirmPassword = confirmPasswordErr; else delete updatedErrors.confirmPassword;
      }
      return updatedErrors;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    const fieldName = id as keyof typeof formData;
    const fieldValue = type === 'checkbox' ? checked : value;
    const err = validateField(fieldName, fieldValue);
    setErrors(prev => {
      const updated = { ...prev };
      if (err) { updated[fieldName] = err; } else { delete updated[fieldName]; }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, api: undefined }));
    if (!validateAll()) {
      Swal.fire({ icon: 'error', title: 'Lỗi đăng ký', text: 'Vui lòng kiểm tra và sửa các lỗi trên form trước khi đăng ký!', confirmButtonText: 'Đóng' });
      return;
    }
    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', { username: formData.username, email: formData.email, password: formData.password });
      if (res.status === 200 || res.status === 201) {
        Swal.fire({ icon: 'success', title: 'Đăng ký thành công!', text: 'Bây giờ bạn có thể đăng nhập.' }).then(() => navigate('/login'));
      }
    } catch (error: any) {
      let message = 'Đã xảy ra lỗi không mong muốn.';
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) message = error.response.data || 'Email hoặc tên người dùng đã tồn tại.';
        else if (error.response.status === 400) message = error.response.data || 'Dữ liệu không hợp lệ.';
        else if (error.response.status === 500) message = error.response.data || 'Lỗi hệ thống.';
      } else { message = 'Không thể kết nối đến máy chủ.'; }
      setErrors(prev => ({ ...prev, api: message }));
      Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: message });
    }
  };

  useEffect(() => {
    const allFieldsPassRules = (Object.keys(formData) as Array<keyof typeof formData>).every(key => !validateField(key, formData[key]));
    const noDisplayErrors = Object.values(errors).every(errorMsg => !errorMsg);
    setIsFormValid(allFieldsPassRules && noDisplayErrors);
  }, [formData, errors]);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'vi',
          includedLanguages: 'en,ja,vi',
          layout: window.google.translate.TranslateElement.InlineLayout.ICON,
        },
        'google_translate_element'
      );
    };

    if (!document.querySelector('#google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <div
        id="google_translate_element"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      ></div>

      {/* ======================= DÁN ĐOẠN STYLE MỚI VÀO ĐÂY ======================= */}
      <style>{`
        /* === TÙY CHỈNH GIAO DIỆN ICON GOOGLE TRANSLATE BẰNG SVG MỚI === */
        
        /* Container chính của widget */
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          width: 40px;
          height: 40px;
          cursor: pointer;
        }

        /* Ẩn icon mặc định và chữ */
        .goog-te-gadget-simple .goog-te-menu-value,
        .goog-te-gadget-simple img {
          display: none !important;
        }

        /* Dùng pseudo-element để vẽ icon mới */
        .goog-te-gadget-simple::before {
          content: '';
          display: block;
          width: 100%;
          height: 100%;
          background-color: white;
          border-radius: 50%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease-in-out;
          
          /* Icon SVG được nhúng trực tiếp */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 0 24 24' width='24px' fill='%235f6368'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17c-.73 2.3-.55 4.51-1.61 6.49l-2.28-2.25L7.05 15l5.09 5.09L17.24 15h-4.37zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: center;
          background-size: 24px 24px;
        }

        /* Hiệu ứng khi di chuột vào */
        .goog-te-gadget-simple:hover::before {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        /* Cửa sổ dropdown khi mở ra */
        .goog-te-menu-frame {
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        
        /* Xóa dòng chữ "Được cung cấp bởi Google Dịch" */
        #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* ----- PHẦN CÒN LẠI CỦA GIAO DIỆN GIỮ NGUYÊN ----- */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Đăng ký tài khoản</h1>
          <form onSubmit={handleSubmit}>
            {/* ...form content... */}
            {errors.api && <div className="mb-4 text-red-600">{errors.api}</div>}
            {['username', 'email', 'password', 'confirmPassword'].map((field) => (
              <div className="mb-6" key={field}>
                <label htmlFor={field} className="block text-sm font-medium mb-2">{field === 'username' ? 'Tên người dùng' : field === 'email' ? 'Địa chỉ email' : field === 'password' ? 'Mật khẩu' : 'Xác nhận mật khẩu'}</label>
                <input type={field.includes('password') ? 'password' : 'text'} id={field} className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${errors[field as keyof typeof formData] ? 'border-red-500 focus:ring-red-600' : 'border-gray-300 focus:ring-green-600'}`} placeholder={field === 'username' ? 'Nhập tên người dùng' : field === 'email' ? 'Nhập địa chỉ email' : field === 'password' ? 'Nhập mật khẩu' : 'Nhập lại mật khẩu'} value={formData[field as keyof typeof formData] as string} onChange={handleChange} onBlur={handleBlur} />
                {errors[field as keyof typeof formData] && (<p className="text-red-500 text-xs mt-1">{errors[field as keyof typeof formData]}</p>)}
              </div>
            ))}
            <div className="flex items-center mb-6">
              <input type="checkbox" id="agreeTerms" className={`h-4 w-4 text-green-600 border rounded ${errors.agreeTerms ? 'border-red-500' : 'border-gray-300'}`} checked={formData.agreeTerms} onChange={handleChange} onBlur={handleBlur} />
              <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">Tôi đồng ý với{' '}<a href="#" className="text-blue-600 hover:underline">điều khoản sử dụng</a></label>
            </div>
            {errors.agreeTerms && (<p className="text-red-500 text-xs mt-1 -mt-4 mb-4">{errors.agreeTerms}</p>)}
            <button type="submit" className="w-full bg-green-800 text-white py-3 rounded-md hover:bg-green-700 transition duration-200" disabled={!isFormValid}>Đăng ký</button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">Bạn đã có tài khoản?{' '}<Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link></p>
          </div>
        </div>
      </div>
      <div className="w-1/2 bg-gray-50 flex items-center justify-center p-12 relative">
        <div className="w-full h-full absolute overflow-hidden">
          <img src="https://readdy.ai/api/search-image?query=Adorable%20illustration%20of%20an%20orange%20tabby%20kitten%20and%20a%20beagle%20puppy%20sitting%20side%20by%20side%2C%20drawn%20in%20a%20cute%20sticker%20style%20with%20white%20outline.%20The%20illustration%20has%20a%20clean%20minimalist%20background%20with%20soft%20shadows%2C%20perfect%20for%20a%20pet-themed%20login%20page.%20The%20animals%20have%20expressive%20eyes%20and%20friendly%20expressions.&width=800&height=1024&seq=pet123&orientation=portrait" alt="Cute pets illustration" className="w-full h-full object-contain object-top"/>
        </div>
      </div>
    </div>
  );
};

export default Register;