import React, { useState } from 'react'
import { FiPrinter, FiRotateCcw } from 'react-icons/fi'
import { FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa'

interface OrderDetailsProps {
  onClose: () => void
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ onClose }) => {
  const [orderData] = useState({
    orderNumber: 'ORD-2024-1234',
    orderDate: '2024-01-15',
    status: 'In Transit',
    trackingNumber: 'TRK-9876543',
    customer: {
      name: 'John Doe',
      address: '123 Main Street, Apt 4B, New York, NY 10001',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      deliveryMethod: 'Express Shipping'
    },
    products: [
      {
        id: 1,
        name: 'Premium Wireless Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        quantity: 2,
        unitPrice: 199.99,
        total: 399.98
      },
      {
        id: 2,
        name: 'Smart Fitness Watch',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        quantity: 1,
        unitPrice: 299.99,
        total: 299.99
      }
    ],
    pricing: {
      subtotal: 699.97,
      shipping: 15.99,
      tax: 56.0,
      discount: 50.0,
      total: 721.96
    },
    timeline: [
      { stage: 'Order Placed', date: 'Jan 15, 2024', completed: true },
      { stage: 'Processing', date: 'Jan 16, 2024', completed: true },
      { stage: 'In Transit', date: 'Jan 17, 2024', completed: true },
      { stage: 'Out for Delivery', date: 'Jan 18, 2024', completed: false },
      { stage: 'Delivered', date: 'Jan 19, 2024', completed: false }
    ]
  })

  const statusColors: { [key: string]: string } = {
    'In Transit': 'bg-yellow-500 text-white',
    Delivered: 'bg-green-500 text-white',
    Canceled: 'bg-red-500 text-white',
    Processing: 'bg-blue-500 text-white'
  }
  const getStatusColor = (status: keyof typeof statusColors) => {
    return statusColors[status] || 'bg-gray-200 text-gray-800'
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          {/* Header Section */}
          <div className='border-b border-gray-200 p-6'>
            <div className='flex justify-between items-center flex-wrap'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Order Details</h1>
                <p className='mt-2 text-sm text-gray-600'>Order #{orderData.orderNumber}</p>
              </div>
              <div className='flex space-x-4'>
                <button
                  className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                  onClick={() => window.print()}
                >
                  <FiPrinter className='mr-2 h-5 w-5' />
                  Print Receipt
                </button>
                <button className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700'>
                  <FiRotateCcw className='mr-2 h-5 w-5' />
                  Return/Exchange
                </button>
                <button
                  onClick={onClose}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='border rounded-lg p-4'>
                <p className='text-sm font-medium text-gray-500'>Order Date</p>
                <p className='mt-1 text-lg font-semibold'>{orderData.orderDate}</p>
              </div>
              <div className='border rounded-lg p-4'>
                <p className='text-sm font-medium text-gray-500'>Status</p>
                <span
                  className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(orderData.status)}`}
                >
                  {orderData.status}
                </span>
              </div>
              <div className='border rounded-lg p-4'>
                <p className='text-sm font-medium text-gray-500'>Tracking Number</p>
                <p className='mt-1 text-lg font-semibold'>{orderData.trackingNumber}</p>
              </div>
              <div className='border rounded-lg p-4'>
                <p className='text-sm font-medium text-gray-500'>Delivery Method</p>
                <p className='mt-1 text-lg font-semibold'>{orderData.customer.deliveryMethod}</p>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className='border-b border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>Customer Information</h2>
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Full Name</p>
                <p className='mt-1'>{orderData.customer.name}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Email</p>
                <p className='mt-1'>{orderData.customer.email}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Phone</p>
                <p className='mt-1'>{orderData.customer.phone}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-500'>Shipping Address</p>
                <p className='mt-1'>{orderData.customer.address}</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className='border-b border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>Order Items</h2>
            <div className='mt-4 overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead>
                  <tr>
                    <th className='px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product
                    </th>
                    <th className='px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Quantity
                    </th>
                    <th className='px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Unit Price
                    </th>
                    <th className='px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {orderData.products.map((product) => (
                    <tr key={product.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0 h-16 w-16'>
                            <img
                              className='h-16 w-16 rounded-md object-cover'
                              src={product.image}
                              alt={product.name}
                              loading='lazy'
                            />
                          </div>
                          <div className='ml-4'>
                            <div className='text-sm font-medium text-gray-900'>{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500'>
                        {product.quantity}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500'>
                        ${product.unitPrice.toFixed(2)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900'>
                        ${product.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Timeline */}
          <div className='border-b border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>Order Timeline</h2>
            <div className='mt-4'>
              <div className='flex items-center justify-between'>
                {orderData.timeline.map((step, index) => (
                  <div key={step.stage} className='relative flex flex-col items-center'>
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      {step.completed ? (
                        <FaCheckCircle className='h-5 w-5 text-white' />
                      ) : (
                        <div className='h-2 w-2 rounded-full bg-gray-400' />
                      )}
                    </div>
                    <div className='mt-2 text-center'>
                      <div className='text-xs font-medium text-gray-900'>{step.stage}</div>
                      <div className='text-xs text-gray-500'>{step.date}</div>
                    </div>
                    {index < orderData.timeline.length - 1 && (
                      <div
                        className={`absolute top-4 left-full w-full h-0.5 transform -translate-x-1/2 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className='p-6'>
            <div className='bg-gray-50 rounded-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-900'>Order Summary</h2>
              <dl className='mt-4 space-y-3'>
                <div className='flex justify-between'>
                  <dt className='text-sm text-gray-600'>Subtotal</dt>
                  <dd className='text-sm font-medium text-gray-900'>${orderData.pricing.subtotal.toFixed(2)}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-sm text-gray-600'>Shipping</dt>
                  <dd className='text-sm font-medium text-gray-900'>${orderData.pricing.shipping.toFixed(2)}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-sm text-gray-600'>Tax</dt>
                  <dd className='text-sm font-medium text-gray-900'>${orderData.pricing.tax.toFixed(2)}</dd>
                </div>
                {orderData.pricing.discount > 0 && (
                  <div className='flex justify-between'>
                    <dt className='text-sm text-gray-600'>Discount</dt>
                    <dd className='text-sm font-medium text-green-600'>-${orderData.pricing.discount.toFixed(2)}</dd>
                  </div>
                )}
                <div className='border-t border-gray-200 pt-3 flex justify-between'>
                  <dt className='text-base font-medium text-gray-900'>Total</dt>
                  <dd className='text-base font-medium text-gray-900'>${orderData.pricing.total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
