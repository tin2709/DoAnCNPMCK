import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import Login from "./pages/login";
import Register from "./pages/register";
import HomePage from "./pages/User/HomePage.tsx";
import ProductManagermentPage from "./pages/User/ProductManagement.tsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/user' element={<HomePage />} />
        <Route path='/products' element={<ProductManagermentPage />} />
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Routes>
    </Router>
  )
}

export default App
