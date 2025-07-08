import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'

import InvoiceRequestPage from './pages/InvoiceRequest'
import Login from "./pages/login";
import Register from "./pages/register";
import HomePage from "./pages/User/HomePage.tsx";
import OrderManagermentPage from "./pages/User/OrderManagement.tsx";
import ProductManagermentPage from "./pages/User/ProductManagement.tsx";
import PaymentSuccessPage from './pages/PaymentSuccessPage.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />

        <Route path='/user' element={<HomePage />} />
        <Route path='/products' element={<ProductManagermentPage />} />
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/orders' element={<OrderManagermentPage />} />
        <Route path='/invoice-requests' element={<InvoiceRequestPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />

        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </Router>
  )
}

export default App
