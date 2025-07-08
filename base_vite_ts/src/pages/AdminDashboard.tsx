import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import UserManagement from '../components/UserManagement';
import OrderManagement from './OrderManagement'; // Assuming this is also a .js or .tsx file
import DashBoard from './DashBoard'; // Assuming this is also a .js or .tsx file
import Chatbox from './Chatbox'; // <<<<---- IMPORT THE CHATBOX COMPONENT (adjust path if needed)
import InvoiceRequestPage from './InvoiceRequest';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('users'); // Default view
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
    // Add more users or fetch them from an API
  ]);

  // State and function for Chatbox visibility
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className='flex h-screen'>
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <main className="flex-1 overflow-auto p-8 bg-gray-100"> {/* Added a light background for contrast */}
        {activeView === 'dashboard' ? (
          <DashBoard />
        ) : activeView === 'users' ? (
          <UserManagement users={users} setUsers={setUsers} />
        ) : activeView === 'orders' ? ( // Assuming 'orders' is the key for OrderManagement
          <OrderManagement />
        ) : activeView === 'invoice-requests' ? ( // Assuming 'orders' is the key for OrderManagement
          <InvoiceRequestPage />
        ) : (
          // <<< SỬA LỖI Ở ĐÂY: Thêm lại phần else (fallback) >>>
          <div>Vui lòng chọn một mục từ thanh bên.</div>
        )}
      </main>

      {/* The chat bubble trigger - Placed outside <main> to be fixed over everything */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#5A67D8', // Example: Indigo color from your example
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            zIndex: 1000, // Ensure it's above most dashboard content
            transition: 'transform 0.2s ease-in-out, background-color 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open Chat"
        >
          💬 {/* Chat bubble icon */}
        </button>
      )}

      {/* Conditionally render the Chatbox - Placed outside <main> */}
      {isChatOpen && (
        <Chatbox
          onClose={toggleChat} // Pass the toggle function as onClose
        />
      )}
    </div>
  );
};

export default AdminDashboard;