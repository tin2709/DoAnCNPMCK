import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import hàm một cách tường minh
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
// --- ICONS TỪ REACT-ICONS ---
import {
  FiEdit,
  FiTrash2,
  FiFileText,
  FiLogOut,
  FiAlertCircle,
  FiX,
  FiShoppingCart,
  FiPackage,
  FiPlus,
  FiMinus,
  FiHome,
  FiSun,  // Thêm vào
  FiMoon
} from 'react-icons/fi';


// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ---
interface Product {
  id: number;
  productName: string;
  categoryName: string;
  image: string;
  price: number;
  des: string;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Category {
  id: number;
  name: string;
}

interface LoggedInUser {
  id: number;
  email: string;
  name: string;
  role: { id: number; roleName: string; };
  accessToken: string;
}

// --- COMPONENT MODAL ---
interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onQuantityChange: (productId: number, newQuantity: number) => void;
  onCreateInvoice: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, items, onQuantityChange, onCreateInvoice }) => {
  if (!isOpen) return null;
  const handleCreate = () => { onCreateInvoice(); onClose(); };
  const totalInvoiceValue = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3"><FiPackage />Chi tiết Yêu cầu Hóa đơn</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><FiX size={24} /></button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Chưa có sản phẩm nào được chọn.</p>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img src={item.product.image} alt={item.product.productName} className="h-16 w-16 object-cover rounded-md" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.product.productName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => onQuantityChange(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"><FiMinus size={14} /></button>
                        <span className="font-medium text-lg w-8 text-center">{item.quantity}</span>
                        <button onClick={() => onQuantityChange(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.quantity} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"><FiPlus size={14} /></button>
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{(item.product.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Tổng cộng:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalInvoiceValue.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500">Hủy</button>
            <button onClick={handleCreate} disabled={items.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">Tạo yêu cầu hóa đơn</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Hook để xác định trang hiện tại
  // THÊM KHỐI CODE MỚI NÀY VÀO VỊ TRÍ VỪA XÓA

  // --- Logic quản lý Dark Mode bằng class của Tailwind ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 1. Ưu tiên lựa chọn đã lưu trong localStorage
    if (localStorage.theme === 'dark') {
      return true;
    }
    // 2. Nếu không có, kiểm tra theme của hệ điều hành
    if (localStorage.theme === 'light') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // useEffect để áp dụng class và lưu lựa chọn
  useEffect(() => {
    const root = document.documentElement; // Thẻ <html>
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Hàm toggle đơn giản chỉ cần thay đổi state
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = sessionStorage.getItem('cartItems');
      // Nếu có dữ liệu trong sessionStorage, parse nó ra. Nếu không, trả về mảng rỗng.
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart items from sessionStorage", error);
      return [];
    }
  });

  // MỚI: Sử dụng useEffect để tự động lưu giỏ hàng vào sessionStorage mỗi khi nó thay đổi
  useEffect(() => {
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const getAuthInfo = useCallback(() => {
    const userLoginInfoString = localStorage.getItem('userLoginInfo');
    if (!userLoginInfoString) {
      Swal.fire('Lỗi', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', 'error');
      navigate('/login');
      return null;
    }
    return JSON.parse(userLoginInfoString) as LoggedInUser;
  }, [navigate]);

  const fetchCategories = useCallback(async (token: string) => {
    try {
      const response = await axios.get<Category[]>('http://localhost:8080/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      Swal.fire('Lỗi', 'Không thể tải danh sách danh mục.', 'error');
    }
  }, []);

  const handleExportPDF = () => {

  };

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      Swal.fire('Không có dữ liệu', 'Không có sản phẩm nào để xuất file Excel.', 'warning');
      return;
    }

    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    // Tạo một worksheet từ dữ liệu sản phẩm đã lọc
    const worksheetData = filteredProducts.map(product => ({
      'Tên sản phẩm': product.productName,
      'Danh mục': product.categoryName,
      'Giá (VNĐ)': product.price, // Giữ dạng số để có thể tính toán trong Excel
      'Mô tả': product.des,
      'Số lượng còn lại': product.quantity
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);

    // Tạo workbook và thêm worksheet vào
    const wb = { Sheets: { 'Sản phẩm': ws }, SheetNames: ['Sản phẩm'] };

    // Ghi workbook ra một buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Tạo Blob từ buffer
    const data = new Blob([excelBuffer], { type: fileType });

    // Dùng file-saver để lưu file
    saveAs(data, 'danh-sach-san-pham' + fileExtension);
  };

  const fetchProducts = useCallback(async (token: string, categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = 'http://localhost:8080/api/products';
      if (categoryId !== 'All') {
        url = `http://localhost:8080/api/products/category/${categoryId}`;
      }
      const response = await axios.get<Product[]>(url, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(response.data);
    } catch (err: any) {
      let errorMessage = "Không thể tải dữ liệu sản phẩm.";
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) errorMessage = "Bạn không có quyền truy cập tài nguyên này.";
        else if (err.response.data) errorMessage = err.response.data.message || err.response.data;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser?.accessToken) {
      Promise.all([
        fetchCategories(currentUser.accessToken),
        fetchProducts(currentUser.accessToken, 'All')
      ]);
    }
  }, [getAuthInfo, fetchCategories, fetchProducts]);

  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser?.accessToken && !loading) {
      fetchProducts(currentUser.accessToken, selectedCategoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('userLoginInfo');
    Swal.fire({ icon: 'success', title: 'Đăng xuất thành công!', showConfirmButton: false, timer: 1500 });
    navigate("/login");
  };

  const handleDelete = (productId: number, productName: string) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?', text: `Bạn sẽ xóa sản phẩm "${productName}".`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280', confirmButtonText: 'Đồng ý, xóa!', cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log(`Deleting product with ID: ${productId}`);
        Swal.fire('Đã xóa!', `Sản phẩm "${productName}" đã được xóa.`, 'success');
      }
    });
  };

  const handleToggleCartItem = (product: Product) => {
    setCartItems(prevItems => {
      const isAlreadyInCart = prevItems.some(item => item.product.id === product.id);
      if (isAlreadyInCart) {
        return prevItems.filter(item => item.product.id !== product.id);
      } else {
        if (product.quantity > 0) {
          return [...prevItems, { product: product, quantity: 1 }];
        }
        Swal.fire('Hết hàng', 'Sản phẩm này đã hết hàng.', 'warning');
        return prevItems;
      }
    });
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleCreateInvoice = async () => {
    const currentUser = getAuthInfo();
    if (!currentUser || cartItems.length === 0) return;

    const itemsPayload = cartItems.reduce((acc, item) => {
      acc[item.product.id] = item.quantity;
      return acc;
    }, {} as Record<number, number>);

    const payload = { idStatus: 1, items: itemsPayload };

    try {
      // THAY ĐỔI: Chờ response trả về, trong đó có ID của đơn hàng
      const response = await axios.post('http://localhost:8080/api/orders/add', payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser.accessToken}` },
      });

      // Lấy ID đơn hàng từ response
      const createdOrderId = response.data.id;

      // THAY ĐỔI: Hiển thị toast thay vì alert thông thường
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000, // Toast tự đóng sau 5 giây
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });

      Toast.fire({
        icon: 'success',
        title: 'Tạo yêu cầu thành công!',
        // THAY ĐỔI: Thêm nút "Hoàn tác" vào toast
        html: `
                    <div>Đã tạo yêu cầu hóa đơn.</div>
                    <button id="undo-button" class="swal2-confirm swal2-styled" style="background-color: #f87171; margin-top: 10px;">Hoàn tác</button>
                `,
        didOpen: () => {
          const undoButton = document.getElementById('undo-button');
          if (undoButton) {
            undoButton.addEventListener('click', () => {
              // Gọi hàm xử lý hoàn tác khi nút được nhấn
              handleUndo(createdOrderId);
              Swal.close(); // Đóng toast sau khi nhấn hoàn tác
            });
          }
        }
      });

      // Reset giỏ hàng và fetch lại sản phẩm để cập nhật số lượng
      setCartItems([]);
      fetchProducts(currentUser.accessToken, selectedCategoryId);

    } catch (err: any) {
      console.error('Lỗi khi gọi API tạo hóa đơn:', err);
      const errorMessage = err.response?.data?.message || 'Không thể tạo hóa đơn. Vui lòng thử lại.';
      Swal.fire({ icon: 'error', title: 'Lỗi!', text: errorMessage });
    }
  };

  // MỚI: Hàm xử lý khi người dùng nhấn nút "Hoàn tác"
  const handleUndo = async (orderId: number) => {
    const currentUser = getAuthInfo();
    if (!currentUser) return;

    try {
      // Gọi API DELETE mới tạo ở backend
      await axios.delete(`http://localhost:8080/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${currentUser.accessToken}` },
      });

      Swal.fire('Đã hoàn tác!', 'Đơn hàng đã được xóa và số lượng sản phẩm đã được khôi phục.', 'success');

      // Quan trọng: Fetch lại dữ liệu sản phẩm để cập nhật UI
      fetchProducts(currentUser.accessToken, selectedCategoryId);

    } catch (err: any) {
      console.error('Lỗi khi hoàn tác đơn hàng:', err);
      Swal.fire('Lỗi!', 'Không thể hoàn tác đơn hàng. Vui lòng thử lại.', 'error');
    }
  };
  const navItems = [
    { path: '/products', label: 'Sản phẩm' },
    { path: '/user', label: 'Người dùng' },
    { path: '/orders', label: 'Đơn hàng' },
  ];
  if (loading && products.length === 0) {
    return <div className="flex justify-center items-center h-screen">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {/* Vùng chứa dropdown, quản lý sự kiện hover */}
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none transition-colors">
                <FiHome size={22} />
              </button>

              {/* Menu dropdown, hiển thị có điều kiện */}
              {isDropdownOpen && (
                // SỬA LỖI Ở ĐÂY:
                // 1. Xóa class `mt-2` để loại bỏ khoảng trống.
                // 2. Thêm class `top-full` để định vị menu ngay dưới phần tử cha.
                // 3. Thêm một chút `pt-2` (padding-top) để tạo khoảng đệm ảo bên trong, không ảnh hưởng đến vùng hover.
                <div className="absolute left-0 top-full pt-2 w-48 z-30">
                  <div className="bg-white rounded-lg shadow-xl py-2">
                    <ul>
                      {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <li key={item.path}>
                            <Link
                              to={item.path}
                              className={`flex items-center px-4 py-2 text-sm transition-colors
                    ${isActive
                                ? 'bg-indigo-100 text-indigo-700 font-semibold' // Style cho link active
                                : 'text-gray-700 hover:bg-gray-100' // Style cho link thường
                              }`
                              }
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Quản lý Sản phẩm
            </h1>
          </div>
          <div className="flex items-center gap-6">

            <button onClick={() => setIsModalOpen(true)} className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiShoppingCart size={24} />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {totalCartQuantity}
                </span>
              )}
            </button>
            <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" aria-label={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}>
              {isDarkMode ? <FiSun size={22} className="text-orange-400" /> : <FiMoon size={22} />}
            </button>

            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiLogOut /><span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* SỬA LỖI: Thêm lại các khối JSX bị thiếu */}
        <nav className="mb-4">

        </nav>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center" role="alert">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2"/>
              <span className="block sm:inline">{error}</span>
            </div>
            <button onClick={() => setError(null)}><FiX/></button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500 flex items-center gap-2 transition-colors"
            >
              <FiFileText/> Xuất Excel
            </button>
          </div>
        </div>
        {/* Kết thúc khối JSX được thêm lại */}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chọn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hình ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số lượng còn lại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hành động</th>
              </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {!loading && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isInCart = cartItems.some(item => item.product.id === product.id);
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isInCart ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input type="checkbox" checked={isInCart} onChange={() => handleToggleCartItem(product)} disabled={product.quantity <= 0 && !isInCart} className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200" />
                      </td>
                      <td className="px-6 py-4"><img src={product.image} alt={product.productName} className="h-12 w-12 object-cover rounded-md" /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.categoryName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.price.toLocaleString('vi-VN')} đ</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900"><FiEdit /></button>
                          <button onClick={() => handleDelete(product.id, product.productName)} className="text-red-600 hover:text-red-900"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Không có sản phẩm nào phù hợp.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} items={cartItems} onQuantityChange={handleQuantityChange} onCreateInvoice={handleCreateInvoice} />
    </div>
  );
}