import { useState } from 'react'
import { format } from 'date-fns'
import OrderDetails from './OrderDetails'
const OrderManagement = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      orderCode: 'ORD001',
      customerName: 'John Doe',
      totalAmount: 1500000,
      status: 'pending',
      orderDate: new Date(2024, 0, 15)
    },
    {
      id: 2,
      orderCode: 'ORD002',
      customerName: 'Jane Smith',
      totalAmount: 2500000,
      status: 'approved',
      orderDate: new Date(2024, 0, 16)
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<{
    id: number
    orderCode: string
    customerName: string
    totalAmount: number
    status: string
    orderDate: Date
  } | null>(null)

  const handleStatusChange = (orderId: any, newStatus: any) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className='max-w-7xl mx-auto'>
      {selectedOrder ? (
        <OrderDetails onClose={() => setSelectedOrder(null)} />
      ) : (
        <>
          <div className='flex justify-between items-center mb-8'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>Order Management</h1>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <input
              type='text'
              placeholder='Search orders...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'
            >
              <option value='All'>All Status</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='delivering'>Delivering</option>
            </select>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-900'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Order Code
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Customer Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Total Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Order Date
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white'>
                      {order.orderCode}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {order.customerName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value='pending'>Pending</option>
                        <option value='approved'>Approved</option>
                        <option value='delivering'>Delivering</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {format(order.orderDate, 'MMM dd, yyyy')}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default OrderManagement
