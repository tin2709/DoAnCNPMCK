import { HiOutlineUserGroup } from 'react-icons/hi'
import { FiHome, FiUsers, FiPackage, FiSettings } from 'react-icons/fi'

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeView, setActiveView }: Props) {
  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-width duration-300 bg-white dark:bg-gray-800 shadow-lg`}
    >
      <div className='p-4'>
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
          className='flex items-center w-full p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700' >
            <FiHome className='w-6 h-6 text-gray-600 dark:text-gray-300' />
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
          <button className='flex items-center w-full p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700'>
            <FiSettings className='w-6 h-6 text-gray-600 dark:text-gray-300' />
            {sidebarOpen && <span className='ml-3 text-gray-700 dark:text-gray-300'>Settings</span>}
          </button>
        </nav>
      </div>
    </aside>
  )
}


