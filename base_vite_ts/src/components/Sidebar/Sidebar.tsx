import { HiOutlineUserGroup } from 'react-icons/hi'
import { FiHome, FiUsers, FiPackage, FiSettings, FiLogOut } from 'react-icons/fi' // Import FiLogOut
import { useNavigate } from 'react-router-dom' // Import useNavigate

interface Props {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeView: string
  setActiveView: (view: string) => void
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeView, setActiveView }: Props) {
  const navigate = useNavigate() // Khởi tạo useNavigate

  const handleLogout = () => {
    // Xóa tất cả thông tin liên quan đến đăng nhập khỏi localStorage
    localStorage.removeItem('userLoginInfo')
    localStorage.removeItem('accessToken')
    // Có thể thêm các thao tác dọn dẹp khác nếu cần (ví dụ: xóa trạng thái người dùng trong Redux/Context)

    // Chuyển hướng người dùng về trang đăng nhập
    navigate('/login')
  }

  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-width duration-300 bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-between`} // Thêm flex-col justify-between để nút logout nằm ở cuối
    >
      <div className='p-4 flex-grow'>
        {' '}
        {/* Thêm flex-grow để nội dung chính chiếm không gian */}
        <div className='flex items-center justify-between'>
          <h2 className={`${sidebarOpen ? 'block' : 'hidden'} text-xl font-bold text-gray-800 dark:text-white`}>
            Admin Panel
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            <HiOutlineUserGroup className='w-6 h-6 text-gray-600 dark:text-gray-300' />
          </button>
        </div>
        <nav className='mt-8 space-y-4'>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center w-full p-3 rounded-lg ${
              activeView === 'dashboard' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FiHome
              className={`w-6 h-6 ${
                activeView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
            {sidebarOpen && <span className='ml-3 text-gray-700 dark:text-gray-300'>Dashboard</span>}
          </button>
          <button
            onClick={() => setActiveView('users')}
            className={`flex items-center w-full p-3 rounded-lg ${
              activeView === 'users' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FiUsers
              className={`w-6 h-6 ${
                activeView === 'users' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
            {sidebarOpen && (
              <span
                className={`ml-3 ${
                  activeView === 'users' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Users
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`flex items-center w-full p-3 rounded-lg ${
              activeView === 'orders' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FiPackage
              className={`w-6 h-6 ${
                activeView === 'orders' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
            {sidebarOpen && (
              <span
                className={`ml-3 ${
                  activeView === 'orders' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Orders
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('invoiceRequests')}
            className={`flex items-center w-full p-3 rounded-lg ${
              activeView === 'invoiceRequests'
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FiPackage
              className={`w-6 h-6 ${
                activeView === 'invoiceRequests'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            />
            {sidebarOpen && (
              <span
                className={`ml-3 ${
                  activeView === 'invoiceRequests'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Invoice Requests
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveView('settings')} // Thêm onClick cho Settings nếu bạn muốn nó cũng là một view
            className={`flex items-center w-full p-3 rounded-lg ${
              activeView === 'settings' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FiSettings
              className={`w-6 h-6 ${
                activeView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
            {sidebarOpen && <span className='ml-3 text-gray-700 dark:text-gray-300'>Settings</span>}
          </button>
        </nav>
      </div>

      {/* Nút Đăng xuất - Đặt ở cuối sidebar */}
      <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
        <button
          onClick={handleLogout}
          className='flex items-center w-full p-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400'
        >
          <FiLogOut className='w-6 h-6 mr-3' />
          {sidebarOpen && <span className='text-red-600 dark:text-red-400'>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
