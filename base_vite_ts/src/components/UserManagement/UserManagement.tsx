import { useState } from 'react'
import { FiUserPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { format } from 'date-fns'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  lastLogin: Date
}

interface Props {
  users: User[]
  setUsers: (users: User[]) => void
}

export default function UserManagement({ users, setUsers }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'All' || user.role === roleFilter
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>User Management</h1>
        <button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
          <FiUserPlus className='w-5 h-5 mr-2' />
          Add User
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <input
          type='text'
          placeholder='Search users...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        >
          <option value='All'>All Roles</option>
          <option value='Admin'>Admin</option>
          <option value='User'>User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
        >
          <option value='All'>All Status</option>
          <option value='Active'>Active</option>
          <option value='Inactive'>Inactive</option>
        </select>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-900'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Email
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Role
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Last Login
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Actions
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
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>{user.role}</td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>{user.status}</td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                  {format(user.lastLogin, 'MMM dd, yyyy')}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <button className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4'>
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
  )
}

