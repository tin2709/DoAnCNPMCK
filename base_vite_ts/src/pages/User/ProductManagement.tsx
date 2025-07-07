import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

// --- ICONS TỪ REACT-ICONS ---
import {
  FiHome,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiLogOut,
  FiAlertCircle,
  FiX,
  FiShoppingCart, // Icon mới cho giỏ hàng
  FiPackage // Icon mới cho modal
} from 'react-icons/fi';


// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (Giữ nguyên) ---
interface Product {
  id: number;
  productName: string;
  categoryName: string;
  image: string;
  price: number;
  des: string;
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

// --- COMPONENT MODAL MỚI CHO YÊU CẦU HÓA ĐƠN ---
interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onCreateInvoice: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, items, onCreateInvoice }) => {
  if (!isOpen) return null;

  const handleCreate = () => {
    // Gọi hàm tạo hóa đơn từ props
    onCreateInvoice();
    // Đóng modal sau khi tạo
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FiPackage />
            Chi tiết Yêu cầu Hóa đơn
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Chưa có sản phẩm nào được chọn.</p>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.productName} className="h-16 w-16 object-cover rounded-md" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Số lượng: 1</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{item.price.toLocaleString('vi-VN')} đ</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500">
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={items.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Tạo yêu cầu hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
export default function ProductManagement() {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE MỚI CHO GIỎ HÀNG VÀ MODAL ---
  const [invoiceItems, setInvoiceItems] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  // --- LOGIC FETCH DỮ LIỆU (SỬA LỖI: Khôi phục lại phần thân hàm) ---
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
      const response = await axios.get<Category[]>("http://localhost:8080/api/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      Swal.fire('Lỗi', 'Không thể tải danh sách danh mục.', 'error');
    }
  }, []);

  const fetchProducts = useCallback(async (token: string, categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = "http://localhost:8080/api/products";
      if (categoryId !== 'All') {
        url = `http://localhost:8080/api/products/category/${categoryId}`;
      }
      const response = await axios.get<Product[]>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Quan trọng: Reset lại giỏ hàng khi fetch lại dữ liệu để tránh mâu thuẫn
      setInvoiceItems([]);
      setProducts(response.data);
    } catch (err: any) {
      let errorMessage = "Không thể tải dữ liệu sản phẩm.";
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) errorMessage = "Bạn không có quyền truy cập tài nguyên này.";
        else if (err.response.data) errorMessage = err.response.data.message || err.response.data;
      }
      setError(errorMessage);
      Swal.fire('Lỗi', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- USEEFFECT HOOKS (Giữ nguyên) ---
  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser && currentUser.accessToken) {
      Promise.all([
        fetchCategories(currentUser.accessToken),
        fetchProducts(currentUser.accessToken, 'All')
      ]);
    }
  }, [getAuthInfo, fetchCategories, fetchProducts]);

  useEffect(() => {
    const currentUser = getAuthInfo();
    if (currentUser && currentUser.accessToken && !loading) {
      fetchProducts(currentUser.accessToken, selectedCategoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);


  // --- HÀM XỬ LÝ SỰ KIỆN VÀ BIẾN DERIVED ---
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
      title: 'Bạn có chắc chắn?',
      text: `Bạn sẽ xóa sản phẩm "${productName}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Đồng ý, xóa!',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Tạm thời chỉ hiển thị thông báo, logic API xóa sẽ ở đây
        console.log(`Deleting product with ID: ${productId}`);
        Swal.fire('Đã xóa!', `Sản phẩm "${productName}" đã được xóa.`, 'success');
        // Sau khi xóa thành công, cần fetch lại dữ liệu
        // const currentUser = getAuthInfo();
        // if (currentUser) fetchProducts(currentUser.accessToken, selectedCategoryId);
      }
    });
  };

  // --- HÀM MỚI: XỬ LÝ VIỆC THÊM/BỚT SẢN PHẨM VÀO GIỎ HÀNG ---
  const handleToggleInvoiceItem = (product: Product) => {
    const isAlreadyInInvoice = invoiceItems.some(item => item.id === product.id);

    if (isAlreadyInInvoice) {
      // Bỏ chọn (Xóa khỏi giỏ hàng)
      setInvoiceItems(prevItems => prevItems.filter(item => item.id !== product.id));
      // Tăng số lượng trong bảng lại 1
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      // Chọn (Thêm vào giỏ hàng)
      // Kiểm tra xem số lượng có lớn hơn 0 không
      if (product.quantity <= 0) {
        Swal.fire('Hết hàng', 'Sản phẩm này đã hết hàng, không thể thêm vào yêu cầu.', 'warning');
        return;
      }
      setInvoiceItems(prevItems => [...prevItems, product]);
      // Giảm số lượng trong bảng đi 1
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity - 1 } : p
        )
      );
    }
  };

  // --- HÀM MỚI: XỬ LÝ KHI TẠO YÊU CẦU HÓA ĐƠN ---
  const handleCreateInvoice = async () => {
    try {
      // Tính tổng tiền từ danh sách sản phẩm
      const total = invoiceItems
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2); // giữ 2 chữ số thập phân, vì API yêu cầu chuỗi "99.48"
  
      // Lấy danh sách ID sản phẩm
      const proList = invoiceItems.map(item => item.id);
  
      const payload = {
        total: total,
        idStatus: 1, // hoặc truyền giá trị động nếu cần
        proList: proList
      };
  
      const response = await fetch('http://localhost:8080/api/orders/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.accessToken}`,
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`Lỗi khi tạo hóa đơn: ${response.status}`);
      }
  
      // const result = await response.json();
  
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: `Đã tạo hóa đơn với ${invoiceItems.length} sản phẩm.`,
        timer: 2000,
        showConfirmButton: false
      });
  
      // Reset giỏ hàng sau khi tạo thành công
      setInvoiceItems([]);
    } catch (err) {
      console.error('Lỗi khi gọi API tạo hóa đơn:', err);
  
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tạo hóa đơn. Vui lòng thử lại.',
      });
    }
  };
  


  // --- RENDER GIAO DIỆN BẰNG REACT THUẦN + TAILWIND CSS ---
  if (loading && products.length === 0) {
    return <div className="flex justify-center items-center h-screen">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Quản lý Sản phẩm
          </h1>
          <div className="flex items-center gap-6">
            {/* --- ICON THÔNG BÁO / GIỎ HÀNG MỚI --- */}
            <button onClick={() => setIsModalOpen(true)} className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiShoppingCart size={24} />
              {invoiceItems.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {invoiceItems.length}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <FiLogOut />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="mb-4">
          <a href="/" className="flex items-center text-sm text-gray-500 hover:text-blue-600">
            <FiHome className="mr-2" />
            <span>Trang chủ</span>
          </a>
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

        {/* Khu vực controls */}
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
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <FiFileText/> Xuất PDF
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <FiFileText/> Xuất Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Vùng header của bảng đã được đơn giản hóa */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 min-h-[52px]">
            {/* Bỏ phần hiển thị số mục đã chọn cho logic cũ */}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {/* Bỏ checkbox "Chọn tất cả" */}
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
              {loading && (
                <tr><td colSpan={7} className="text-center py-4">Đang tải lại sản phẩm...</td></tr>
              )}
              {!loading && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isInInvoice = invoiceItems.some(item => item.id === product.id);
                  const originalProduct = products.find(p => p.id === product.id);
                  const isOutOfStock = originalProduct ? originalProduct.quantity <= 0 : true;

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isInInvoice ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isInInvoice}
                          onChange={() => handleToggleInvoiceItem(product)}
                          // Vô hiệu hóa nếu sản phẩm hết hàng VÀ chưa có trong giỏ
                          disabled={isOutOfStock && !isInInvoice}
                          className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200"
                        />
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
              ) : !loading && (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Không có sản phẩm nào phù hợp.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- Render Modal --- */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={invoiceItems}
        onCreateInvoice={handleCreateInvoice}
      />
    </div>
  );
}