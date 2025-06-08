import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import UserManagement from '../components/UserManagement'
import OrderManagement from './OrderManagement'
import DashBoard from './DashBoard'

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState('users')
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: new Date(2024, 0, 15)
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
      status: 'Inactive',
      lastLogin: new Date(2024, 0, 10)
    }
  ])

  return (
    <div className='flex h-screen'>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
      />
     <main className="flex-1 overflow-auto p-8">
  {activeView === 'dashboard' ? (
    <DashBoard />
  ) : activeView === 'users' ? (
    <UserManagement users={users} setUsers={setUsers} /> 
  ) : (
    <OrderManagement />
  )}
</main>
    </div>
  )
}

export default AdminDashboard
