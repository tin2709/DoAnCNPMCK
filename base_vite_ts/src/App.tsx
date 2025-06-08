import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
