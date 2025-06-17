import  { useState, useEffect } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { MdBlock, MdCheckCircle } from 'react-icons/md'; // Icons cho ban/unban
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

// Định nghĩa interface cho dữ liệu từ backend
interface BackendRole {
  id: number;
  roleName: string;
}

interface User { // Đổi tên để tránh nhầm lẫn với interface cũ
  id: number;
  email: string;
  name: string;
  role: BackendRole; // role bây giờ là một đối tượng
  password?: string; // Tùy chọn, backend có thể không trả về
  active: boolean; // active là boolean
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lấy thông tin người dùng hiện tại từ localStorage
  const userLoginInfoString = localStorage.getItem('userLoginInfo');
  const currentUser = userLoginInfoString ? JSON.parse(userLoginInfoString) : null;
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role?.roleName;
  const isAdmin = currentUserRole === 'ADMIN';

  // Hàm để fetch danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser || !currentUser.accessToken) {
        Swal.fire('Lỗi', 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('/login'); // Chuyển hướng về trang login nếu không có token
        return;
      }

      const response = await axios.get<User[]>("http://localhost:8080/api/users/list", {
        headers: {
          Authorization: `Bearer ${currentUser.accessToken}`
        }
      });
      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      let errorMessage = "Không thể tải danh sách người dùng.";
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          errorMessage = "Bạn không có quyền xem danh sách người dùng.";
        } else if (err.response.data) {
          errorMessage = err.response.data;
        }
      }
      setError(errorMessage);
      Swal.fire('Lỗi', errorMessage, 'error');
      // Nếu lỗi 403 (Forbidden) hoặc 401 (Unauthorized), có thể chuyển hướng về login
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        localStorage.removeItem('userLoginInfo'); // Xóa token cũ
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Gọi hàm fetchUsers khi component được mount

  // Hàm xử lý ban/unban người dùng
  const handleBanUnban = async (userId: number, currentActiveStatus: boolean, userName: string) => {
    const action = currentActiveStatus ? "ban" : "unban";
    const actionVerb = currentActiveStatus ? "chặn" : "bỏ chặn";
    const icon = currentActiveStatus ? 'warning' : 'info';
    const confirmButtonColor = currentActiveStatus ? '#dc3545' : '#28a745';

    const result = await Swal.fire({
      title: `Bạn có chắc muốn ${actionVerb} người dùng ${userName}?`,
      text: `Hành động này sẽ ${actionVerb} tài khoản của ${userName}.`,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Đồng ý ${actionVerb}!`,
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        if (!currentUser || !currentUser.accessToken) {
          Swal.fire('Lỗi', 'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.', 'error');
          navigate('/login');
          return;
        }

        const endpoint = currentActiveStatus ? `/api/users/${userId}/ban` : `/api/users/${userId}/unban`;
        const response = await axios.put<User>(`http://localhost:8080${endpoint}`, {}, {
          headers: {
            Authorization: `Bearer ${currentUser.accessToken}`
          }
        });

        // Cập nhật trạng thái người dùng trong UI
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, active: response.data.active } : user
          )
        );

        Swal.fire(
          `${actionVerb} thành công!`,
          `Người dùng ${userName} đã được ${actionVerb}.`,
          'success'
        );

      } catch (error: any) {
        console.error(`Error ${action}ing user:`, error);
        let errorMessage = `Không thể ${actionVerb} người dùng ${userName}.`;
        if (axios.isAxiosError(error) && error.response) {
          errorMessage = error.response.data || errorMessage;
          if (error.response.status === 403) {
            errorMessage = "Bạn không có quyền thực hiện hành động này.";
          } else if (error.response.status === 400 && errorMessage.includes("cannot ban your own account")) {
            errorMessage = "Bạn không thể tự chặn tài khoản của mình.";
          }
        }
        Swal.fire(
          `Thất bại!`,
          errorMessage,
          'error'
        );
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role.roleName === roleFilter.toUpperCase(); // Chuyển đổi để khớp với backend (ADMIN, USER)
    const matchesStatus = statusFilter === 'All' || (user.active ? 'Active' : 'Inactive') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 dark:text-gray-300">
        Đang tải danh sách người dùng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto p-4'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>Quản lý người dùng</h1>
        <button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
          <FiUserPlus className='w-5 h-5 mr-2' />
          Thêm người dùng
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <input
          type='text'
          placeholder='Tìm kiếm người dùng...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        >
          <option value='All'>Tất cả vai trò</option>
          <option value='ADMIN'>ADMIN</option>
          <option value='USER'>USER</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        >
          <option value='All'>Tất cả trạng thái</option>
          <option value='Active'>Hoạt động</option>
          <option value='Inactive'>Bị chặn</option>
        </select>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-900'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Tên
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Email
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Vai trò
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Trạng thái
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
              Hành động
            </th>
          </tr>
          </thead>
          <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                {user.name}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>{user.email}</td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>{user.role.roleName}</td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.active ? 'Hoạt động' : 'Bị chặn'}
                  </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end'>
                {/* Chỉ hiện icon ban/unban nếu là ADMIN VÀ không phải tài khoản của chính mình */}
                {isAdmin && currentUserId !== user.id && (
                  <button
                    onClick={() => handleBanUnban(user.id, user.active, user.name)}
                    className={`text-lg p-1 rounded-full ${user.active ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'} mr-2`}
                    title={user.active ? 'Chặn người dùng' : 'Bỏ chặn người dùng'}
                  >
                    {user.active ? <MdBlock /> : <MdCheckCircle />}
                  </button>
                )}
                <button className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2'>
                  <FiEdit2 className='w-5 h-5' />
                </button>
                <button className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'>
                  <FiTrash2 className='w-5 h-5' />
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}