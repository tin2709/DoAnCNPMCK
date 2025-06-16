import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  // FIX: Define a new type for errors that ensures all properties can be strings
  type FormErrors = {
    [K in keyof typeof formData]?: string;
  } & { api?: string };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // FIX: Type 'name' parameter more specifically
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
        // FIX: Ensure value is string before checking length
        if (typeof value !== 'string' || !value) return 'Mật khẩu không được để trống.';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
        break;
      case 'confirmPassword':
        // FIX: Ensure value is string before comparison
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
    const newErrors: FormErrors = {}; // Use the new FormErrors type
    // FIX: Type assert Object.keys result for better type safety
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    // FIX: Type assert 'id' to 'keyof typeof formData'
    const fieldName = id as keyof typeof formData;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));

    // Real-time validation for password and confirmPassword, and immediate clear for others
    setErrors(prev => {
      const updatedErrors = { ...prev };

      // Validate the current field
      const err = validateField(fieldName, fieldValue);
      if (err) {
        updatedErrors[fieldName] = err;
      } else {
        delete updatedErrors[fieldName];
      }

      // Special handling for password/confirmPassword to re-validate related fields
      if (fieldName === 'password' || fieldName === 'confirmPassword') {
        const currentPassword = fieldName === 'password' ? (fieldValue as string) : formData.password;
        const currentConfirmPassword = fieldName === 'confirmPassword' ? (fieldValue as string) : formData.confirmPassword;

        // Re-validate password field
        const passwordErr = validateField('password', currentPassword);
        if (passwordErr) updatedErrors.password = passwordErr;
        else delete updatedErrors.password;

        // Re-validate confirmPassword field
        const confirmPasswordErr = validateField('confirmPassword', currentConfirmPassword);
        if (confirmPasswordErr) updatedErrors.confirmPassword = confirmPasswordErr;
        else delete updatedErrors.confirmPassword;
      }
      return updatedErrors;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    // FIX: Type assert 'id' to 'keyof typeof formData'
    const fieldName = id as keyof typeof formData;
    const fieldValue = type === 'checkbox' ? checked : value;

    const err = validateField(fieldName, fieldValue);
    setErrors(prev => {
      const updated = { ...prev };
      if (err) {
        updated[fieldName] = err;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, api: undefined })); // Clear previous API error

    // Perform full form validation before submission
    if (!validateAll()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đăng ký',
        text: 'Vui lòng kiểm tra và sửa các lỗi trên form trước khi đăng ký!',
        confirmButtonText: 'Đóng',
      });
      return;
    }

    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: 'success',
          title: 'Đăng ký thành công!',
          text: 'Bây giờ bạn có thể đăng nhập.',
        }).then(() => navigate('/login'));
      }
    } catch (error: any) {
      let message = 'Đã xảy ra lỗi không mong muốn.';
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          message = error.response.data || 'Email hoặc tên người dùng đã tồn tại.';
        } else if (error.response.status === 400) {
          message = error.response.data || 'Dữ liệu không hợp lệ.';
        } else if (error.response.status === 500) {
          message = error.response.data || 'Lỗi hệ thống.';
        }
      } else {
        message = 'Không thể kết nối đến máy chủ.';
      }
      setErrors(prev => ({ ...prev, api: message }));
      Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: message });
    }
  };

  useEffect(() => {
    // Check if all fields meet their validation rules based on current formData values
    const allFieldsPassRules = (Object.keys(formData) as Array<keyof typeof formData>).every(key => {
      const err = validateField(key, formData[key]);
      return !err; // No error means valid
    });

    // Check if the errors state (which controls what's displayed) is empty
    const noDisplayErrors = Object.values(errors).every(errorMsg => !errorMsg);

    // The form is valid if all fields meet their rules AND there are no error messages currently stored.
    setIsFormValid(allFieldsPassRules && noDisplayErrors);
  }, [formData, errors]); // Depend on formData and errors to re-evaluate validity

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8">Đăng ký tài khoản</h1>
          <form onSubmit={handleSubmit}>
            {errors.api && <div className="mb-4 text-red-600">{errors.api}</div>}

            {['username', 'email', 'password', 'confirmPassword'].map((field) => (
              <div className="mb-6" key={field}>
                <label htmlFor={field} className="block text-sm font-medium mb-2">
                  {field === 'username'
                    ? 'Tên người dùng'
                    : field === 'email'
                      ? 'Địa chỉ email'
                      : field === 'password'
                        ? 'Mật khẩu'
                        : 'Xác nhận mật khẩu'}
                </label>
                <input
                  type={field.includes('password') ? 'password' : 'text'}
                  id={field}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                    errors[field as keyof typeof formData] // Cast for type safety
                      ? 'border-red-500 focus:ring-red-600'
                      : 'border-gray-300 focus:ring-green-600'
                  }`}
                  placeholder={
                    field === 'username'
                      ? 'Nhập tên người dùng'
                      : field === 'email'
                        ? 'Nhập địa chỉ email'
                        : field === 'password'
                          ? 'Nhập mật khẩu'
                          : 'Nhập lại mật khẩu'
                  }
                  // FIX: Type assert formData[field] as string, as input value must be string
                  value={formData[field as keyof typeof formData] as string}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors[field as keyof typeof formData] && ( // Cast for type safety
                  <p className="text-red-500 text-xs mt-1">{errors[field as keyof typeof formData]}</p>
                )}
              </div>
            ))}

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="agreeTerms"
                className={`h-4 w-4 text-green-600 border rounded ${
                  errors.agreeTerms ? 'border-red-500' : 'border-gray-300'
                }`}
                checked={formData.agreeTerms}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <label htmlFor="agreeTerms" className="ml-2 text-sm text-gray-700">
                Tôi đồng ý với{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  điều khoản sử dụng
                </a>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs mt-1 -mt-4 mb-4">{errors.agreeTerms}</p>
            )}

            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 rounded-md hover:bg-green-700 transition duration-200"
              disabled={!isFormValid}
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