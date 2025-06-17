// src/components/Home/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Import react-icons
import {
  FiChevronDown, FiLogOut, FiDollarSign, FiUsers, FiBox,
  FiFileText, FiSettings, FiMail, FiUser, FiInfo, FiBarChart2,
  FiPhone, FiCalendar, FiLoader
} from 'react-icons/fi';

// Animation libraries
import { OverPack } from 'rc-scroll-anim';
import QueueAnim from 'rc-queue-anim';

// REMOVED: const API_BASE_URL = "https://localhost:8080"; // No longer needed as we're removing API calls

// REMOVED: UserPermission interface is not strictly needed if we're not fetching permissions
// interface UserPermission {
//   resource: string;
//   action: string;
// }

interface FormState {
  name: string;
  email: string;
  message: string;
}

// --- INTERFACES FOR DROPDOWN ITEMS (kept for type safety in UI) ---
interface BaseMenuItem {
  key: string;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
}

interface RegularMenuItem extends BaseMenuItem {
  type: 'menu'; // Discriminant property
  resource?: string; // Optional for filtering logic (still relevant for static role checks)
  requiredAction?: string; // Optional for filtering logic (still relevant for static role checks)
}

interface DividerMenuItem {
  key: string;
  type: 'divider'; // Discriminant property
}

interface LogoutMenuItem extends BaseMenuItem {
  type: 'logout'; // Discriminant property
  danger: boolean; // Specific property for logout item
}

// Union type for all possible dropdown items
type ManagementDropdownItem = RegularMenuItem | DividerMenuItem | LogoutMenuItem;
// --- END INTERFACES ---


const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || 'User';
  const rawUserRole = localStorage.getItem("userRole"); // "1": Admin, "2": Accountant, "3": Sales Rep
  const maTK = localStorage.getItem("maTK");
  const accessToken = localStorage.getItem("accessToken"); // Using accessToken consistently

  const [renderBelowFold, setRenderBelowFold] = useState<boolean>(false);
  // REMOVED: userPermissions state as it's no longer fetched dynamically
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false); // Always false, no API call

  // Dropdown state for management
  const [isManagementDropdownOpen, setIsManagementDropdownOpen] = useState<boolean>(false);

  // Contact form state
  const [contactForm, setContactForm] = useState<FormState>({ name: '', email: '', message: '' });
  const formRef = useRef<HTMLFormElement>(null); // Ref for form reset

  // Effect for delayed rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderBelowFold(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isManagementDropdownOpen && !(event.target as HTMLElement).closest('.management-dropdown-wrapper')) {
        setIsManagementDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isManagementDropdownOpen]);


  // --- Simplified Effect for initial authentication check (NO API CALLS HERE) ---
  useEffect(() => {
    // This effect now only checks for basic client-side authentication tokens
    // and redirects if they are missing. It does NOT make any API calls.
    if (!accessToken) {
      console.error("Missing maTK or accessToken in localStorage. Redirecting to login.");
      alert("Your session is invalid. Please log in again.");
      navigate('/login');
      // We set permissionsLoading to false immediately as there's no fetch happening.
      setPermissionsLoading(false);
      return;
    }

    // Since we are not fetching permissions, and rely solely on rawUserRole
    // for menu filtering, we can set permissionsLoading to false directly.
    setPermissionsLoading(false);

  }, [maTK, accessToken, navigate]); // Dependencies reflect what's used in this simplified effect

  let greetingMessage = `Hello, ${username}!`;
  if (rawUserRole === "2") {
    greetingMessage = `Accountant, ${username}`;
  } else if (rawUserRole === "3") {
    greetingMessage = `Sales Rep, ${username}`;
  } else if (rawUserRole === "1") {
    greetingMessage = `Admin, ${username}`;
  }

  const handleLogout = () => {
    // This is a client-side logout, no API call involved directly here.
    localStorage.removeItem('authToken'); // Keep original authToken if used for login
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('maTK');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginSuccessTimestamp');
    localStorage.removeItem('expireAt');
    localStorage.removeItem('accessToken'); // Clear accessToken too

    alert("Logged out successfully!");
    window.location.href = "/login";
  };

  // Define ALL potential menu items with their required resource and action for Invoice Management
  // 'resource' and 'requiredAction' are kept here for the static role-based filtering logic.
  const rawMenuItems: Omit<RegularMenuItem, 'onClick'>[] = [
    {
      key: '/invoices',
      icon: <FiFileText />,
      label: 'Manage Invoices',
      resource: 'INVOICE',
      requiredAction: 'VIEW',
      type: 'menu',
    },
    {
      key: '/customers',
      icon: <FiUsers />,
      label: 'Manage Customers',
      resource: 'CUSTOMER',
      requiredAction: 'VIEW',
      type: 'menu',
    },
    {
      key: '/products',
      icon: <FiBox />,
      label: 'Manage Products',
      resource: 'PRODUCT',
      requiredAction: 'VIEW',
      type: 'menu',
    },
    {
      key: '/reports',
      icon: <FiBarChart2 />,
      label: 'View Reports',
      resource: 'REPORT',
      requiredAction: 'VIEW',
      type: 'menu',
    },
    {
      key: '/settings',
      icon: <FiSettings />,
      label: 'System Settings',
      resource: 'SETTINGS',
      requiredAction: 'VIEW',
      type: 'menu',
    },
  ];

  // Menu filtering is now purely based on rawUserRole, not fetched permissions.
  const filteredMenuItems: RegularMenuItem[] = rawMenuItems.filter(item => {
    if (rawUserRole === "1") { // Admin sees all management items
      return true;
    } else if (rawUserRole === "2") { // Accountant: Invoices, Customers, Reports
      return ['/invoices', '/customers', '/reports'].includes(item.key);
    } else if (rawUserRole === "3") { // Sales Rep: Invoices, Customers, Products
      return ['/invoices', '/customers', '/products'].includes(item.key);
    } else {
      // For any other role, or if rawUserRole is null/undefined,
      // no management items are shown by default.
      // You might customize this to show a default set or none.
      // Currently, it will show nothing unless explicitly listed above.
      return false;
    }
  }).map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => {
      navigate(item.key);
      setIsManagementDropdownOpen(false);
    },
    type: 'menu',
  }));

  const managementDropdownItems: ManagementDropdownItem[] = [
    ...filteredMenuItems,
    { type: 'divider', key: 'divider-logout' },
    {
      key: 'logout',
      icon: <FiLogOut />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
      type: 'logout',
    },
  ];

  const onContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const onContactFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Contact form submitted: ', contactForm);

    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert("Please fill in all required fields!");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      alert("Please enter a valid email address!");
      return;
    }

    // This is a client-side simulation, no actual API call.
    setTimeout(() => {
      alert("Your message has been sent successfully!");
      setContactForm({ name: '', email: '', message: '' });
      if (formRef.current) {
        formRef.current.reset();
      }
    }, 500);
  };

  const aboutUsImageUrl = "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  // isManagementDropdownDisabled will now only be true if rawUserRole is not 1, 2, or 3.
  // Since permissionsLoading is always false, it's effectively disabled only if roles are not static.
  // If filteredMenuItems is empty, the dropdown contents won't show anyway.
  const isManagementDropdownDisabled = permissionsLoading || filteredMenuItems.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-blue-800 text-white shadow-md z-50 py-4 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider">InvoicePro</div>
        <nav className="flex items-center space-x-6">
          <a href="#about" className="hover:text-blue-200 transition-colors">About Us</a>
          <a href="#features" className="hover:text-blue-200 transition-colors">Features</a>
          <a href="#contact" className="hover:text-blue-200 transition-colors">Contact</a>

          {/* Management Dropdown */}
          <div className="relative management-dropdown-wrapper">
            <button
              className={`flex items-center space-x-1 py-2 px-3 rounded-md hover:bg-blue-700 transition-colors
                                ${isManagementDropdownDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isManagementDropdownDisabled && setIsManagementDropdownOpen(!isManagementDropdownOpen)}
              disabled={isManagementDropdownDisabled}
            >
              <span>Management</span>
              {isManagementDropdownDisabled ? (
                <FiLoader className="animate-spin text-sm" />
              ) : (
                <FiChevronDown className={`ml-1 transition-transform ${isManagementDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
            {isManagementDropdownOpen && !isManagementDropdownDisabled && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg z-20 overflow-hidden">
                {managementDropdownItems.map(item => {
                  if (item.type === 'divider') {
                    return <hr key={item.key} className="border-t border-gray-200 my-1" />;
                  } else if (item.type === 'logout') {
                    return (
                      <button
                        key={item.key}
                        onClick={item.onClick}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 ${item.danger ? 'text-red-600' : ''}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  } else { // type is 'menu'
                    return (
                      <button
                        key={item.key}
                        onClick={item.onClick}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                })}
              </div>
            )}
          </div>

          <span className="text-white ml-4">{greetingMessage}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-blue-700 transition-colors"
            title="Logout"
          >
            <FiLogOut className="text-xl" />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center py-24 px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Streamline Your Billing. Manage Invoices with Ease.</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 opacity-90">
            InvoicePro empowers businesses to create, track, and manage invoices efficiently, ensuring smooth financial operations and timely payments.
          </p>
          <a href="#about" className="inline-block bg-white text-blue-700 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-all shadow-lg">
            Learn More
          </a>
        </section>

        {/* Render below-the-fold content or placeholders */}
        {renderBelowFold ? (
          <>
            {/* About Section */}
            <section id="about" className="py-16 px-6 bg-gray-100">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                  <FiInfo className="inline-block mr-3 text-blue-600" />About InvoicePro
                </h2>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src={aboutUsImageUrl}
                      alt="Invoice management software interface"
                      className="w-full h-auto max-w-md mx-auto rounded-lg shadow-xl"
                      loading="lazy"
                    />
                  </div>
                  <div className="order-1 md:order-2 text-lg text-gray-700 space-y-6">
                    <p>InvoicePro is a comprehensive solution designed to simplify the complex world of invoicing. Our platform helps businesses of all sizes automate their billing processes, reduce manual errors, and improve cash flow.</p>
                    <p>We focus on providing intuitive tools for invoice generation, payment tracking, and robust reporting, giving you full control and visibility over your financial transactions.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <OverPack id="features" className="py-16 px-6 bg-white" playScale={0.2}>
              <div key="features-content" className="max-w-6xl mx-auto">
                <QueueAnim key="features-anim" type={['bottom', 'top']} leaveReverse>
                  <h2 key="title" className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                    <FiDollarSign className="inline-block mr-3 text-green-600" />Key Features
                  </h2>
                  <div key="cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiFileText className="text-5xl text-blue-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Easy Invoice Creation</h3>
                      <p className="text-gray-600 text-center">Generate professional invoices quickly with customizable templates and automated calculations.</p>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiCalendar className="text-5xl text-yellow-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Real-time Payment Tracking</h3>
                      <p className="text-gray-600 text-center">Monitor payment statuses, send reminders, and keep a clear record of all transactions.</p>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <FiBarChart2 className="text-5xl text-purple-600 mb-4 mx-auto" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Comprehensive Analytical Reports</h3>
                      <p className="text-gray-600 text-center">Gain insights into your sales, outstanding payments, and financial performance with detailed reports.</p>
                    </div>
                  </div>
                </QueueAnim>
              </div>
            </OverPack>

            {/* Contact Section */}
            <section id="contact" className="py-16 px-6 bg-gray-100">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800">
                  <FiPhone className="inline-block mr-3 text-red-600" />Contact Us
                </h2>
                <p className="text-lg text-gray-600 text-center mb-12">Have questions or need support? Reach out to our team.</p>
                <form ref={formRef} onSubmit={onContactFormSubmit} className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={onContactFormChange}
                          className="pl-10 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Your Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={contactForm.email}
                          onChange={onContactFormChange}
                          className="pl-10 p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={contactForm.message}
                      onChange={onContactFormChange}
                      className="p-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Type your message here..."
                      required
                    ></textarea>
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white font-bold py-3 px-8 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Placeholders for below-fold content */}
            <div className="h-96 bg-gray-200 animate-pulse flex items-center justify-center text-gray-500 text-xl">Loading About Section...</div>
            <div className="h-80 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-xl">Loading Features Section...</div>
            <div className="h-96 bg-gray-200 animate-pulse flex items-center justify-center text-gray-500 text-xl">Loading Contact Form...</div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} InvoicePro. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;