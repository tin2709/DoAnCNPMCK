import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/login'
import Register from './pages/register'
import HomePage from './pages/User/HomePage.tsx'
import InvoiceRequestPage from './pages/InvoiceRequest'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/login' replace />} />

        <Route path='/user' element={<HomePage />} />
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/invoice-requests' element={<InvoiceRequestPage />} />

        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </Router>
  )
}

export default App
