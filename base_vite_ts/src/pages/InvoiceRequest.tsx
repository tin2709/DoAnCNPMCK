import React, { useEffect, useState } from 'react'
import { fetchInvoiceRequests, acceptInvoiceRequest, rejectInvoiceRequest } from '../api/invoiceRequest.api'
import { InvoiceRequest, INVOICE_STATUS_OPTIONS } from '../types/InvoiceRequest'

const InvoiceRequestPage: React.FC = () => {
  const [data, setData] = useState<InvoiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Không tìm thấy token đăng nhập')
        setLoading(false)
        return
      }
      try {
        const result = await fetchInvoiceRequests(token)
        setData(result.filter((item) => [1, 2, 3, 4].includes(item.statusId)))
      } catch (err) {
        setError('Lỗi khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleEdit = (id: number, currentStatus: number) => {
    setEditingId(id)
    setEditStatus(currentStatus)
  }

  const handleSave = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Không tìm thấy token đăng nhập')
      return
    }
    try {
      if (editStatus === 2) {
        await rejectInvoiceRequest(id, token)
        setMessage('Đã từ chối yêu cầu')
      } else if (editStatus === 3 || editStatus === 4) {
        await acceptInvoiceRequest(id, token)
        setMessage('Đã cập nhật trạng thái thành công')
      } else if (editStatus === 1) {
        setMessage('Đã chuyển về trạng thái chờ xét duyệt (không gọi API)')
      }
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, statusId: editStatus ?? item.statusId } : item))
      )
    } catch (err) {
      setError('Có lỗi khi cập nhật trạng thái')
    } finally {
      setEditingId(null)
      setEditStatus(null)
      setTimeout(() => setMessage(null), 2000)
    }
  }

  if (loading) return <div>Đang tải...</div>
  if (error) return <div>{error}</div>

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Danh sách Invoice Requests</h1>
      {message && <div className='mb-2 text-green-600'>{message}</div>}
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200'>
          <thead>
            <tr>
              <th className='px-4 py-2 border'>ID</th>
              <th className='px-4 py-2 border'>User ID</th>
              <th className='px-4 py-2 border'>Order ID</th>
              <th className='px-4 py-2 border'>Status</th>
              <th className='px-4 py-2 border'>Created At</th>
              <th className='px-4 py-2 border'>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className='text-center'>
                <td className='px-4 py-2 border'>{item.id}</td>
                <td className='px-4 py-2 border'>{item.userId}</td>
                <td className='px-4 py-2 border'>{item.orderId}</td>
                <td className='px-4 py-2 border'>
                  {editingId === item.id ? (
                    <select
                      className='border rounded px-2 py-1'
                      value={editStatus ?? item.statusId}
                      onChange={(e) => setEditStatus(Number(e.target.value))}
                    >
                      {INVOICE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    INVOICE_STATUS_OPTIONS.find((opt) => opt.id === item.statusId)?.label || item.statusId
                  )}
                </td>
                <td className='px-4 py-2 border'>{item.createdAt}</td>
                <td className='px-4 py-2 border'>
                  {editingId === item.id ? (
                    <button
                      className='bg-blue-500 text-white px-3 py-1 rounded mr-2'
                      onClick={() => handleSave(item.id)}
                    >
                      Lưu
                    </button>
                  ) : (
                    <button
                      className='bg-gray-300 px-3 py-1 rounded'
                      onClick={() => handleEdit(item.id, item.statusId)}
                    >
                      Đổi trạng thái
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InvoiceRequestPage
