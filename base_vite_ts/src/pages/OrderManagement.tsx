import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import OrderDetails from './OrderDetails'

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    picture: '',
    tokenOrder: '',
    total: '',
    userId: '',
    idStatus: '1'
  });


  useEffect(() => {
    fetch('http://localhost:8080/dashboard/list')
      .then(response => response.json())
      .then(data => {
        // Map lại để đồng bộ cấu trúc dữ liệu với component
        const mapped = data.map((item: any) => ({
          id: item.id,
          orderCode: item.tokenOrder,
          customerName: item.createBy?.name || 'Unknown',
          totalAmount: item.total,
          status: item.status?.name || 'pending',
          orderDate: item.date // vẫn là chuỗi ISO, parse sau
        }));
        setOrders(mapped);
        console.log(mapped);
      })
      .catch(error => {
        console.error('Có lỗi:', error);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleStatusChange = (orderId: any, newStatus: any) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (

    <div className='max-w-7xl mx-auto'>
      {selectedOrder ? (
        <OrderDetails onClose={() => setSelectedOrder(null)} />
      ) : (
        <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order Management</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tạo đơn hàng
          </button>
        </div>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-md w-96">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Tạo đơn hàng mới</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Token Order"
                  value={newOrder.tokenOrder}
                  onChange={(e) => setNewOrder({ ...newOrder, tokenOrder: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Total"
                  value={newOrder.total}
                  onChange={(e) => setNewOrder({ ...newOrder, total: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="User ID"
                  value={newOrder.userId}
                  onChange={(e) => setNewOrder({ ...newOrder, userId: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={newOrder.idStatus}
                  onChange={(e) => setNewOrder({ ...newOrder, idStatus: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
                >
                  <option value="1">Pending</option>
                  <option value="2">Approved</option>
                  <option value="3">Delivering</option>
                </select>
              </div>
              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:8080/dashboard/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newOrder)
                      });
                      if (response.ok) {
                        alert('Tạo đơn hàng thành công!');
                        setIsCreateModalOpen(false);
                        setNewOrder({ picture: '', tokenOrder: '', total: '', userId: '', idStatus: '1' });
                        // gọi lại API danh sách đơn hàng
                        const res = await fetch('http://localhost:8080/dashboard/list');
                        const data = await res.json();
                        setOrders(data.map((item: any) => ({
                          id: item.id,
                          orderCode: item.tokenOrder,
                          customerName: item.createBy?.name || 'Unknown',
                          totalAmount: item.total,
                          status: item.status?.name || 'pending',
                          orderDate: item.createAt
                        })));
                      } else {
                        alert('Tạo đơn hàng thất bại!');
                      }
                    } catch (error) {
                      console.error('Lỗi tạo đơn hàng:', error);
                      alert('Lỗi kết nối máy chủ!');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        )}


          {/* UI filter ... */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-900'>
                <tr>
                  <th className='px-6 py-3'>Order Code</th>
                  <th className='px-6 py-3'>Customer Name</th>
                  <th className='px-6 py-3'>Total Amount</th>
                  <th className='px-6 py-3'>Status</th>
                  <th className='px-6 py-3'>Order Date</th>
                  <th className='px-6 py-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className='px-6 py-4'>{order.orderCode}</td>
                    <td className='px-6 py-4'>{order.customerName}</td>
                    <td className='px-6 py-4'>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </td>
                    <td className='px-6 py-4'>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value='pending'>Pending</option>
                        <option value='approved'>Approved</option>
                        <option value='delivering'>Delivering</option>
                      </select>
                    </td>
                    <td className='px-6 py-4'>
                      {order.orderDate
                        ? format(parseISO(order.orderDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <button onClick={() => setSelectedOrder(order)}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderManagement;
