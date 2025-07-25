import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaUsers, FaEnvelope, FaSignOutAlt, FaCode, FaNewspaper, FaBars, FaTimes,
} from 'react-icons/fa';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';

const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

const linkVariants = {
  hover: {
    scale: 1.1,
    color: '#ffffff',
    transition: { duration: 0.3 },
  },
};

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
        }
      } catch (err) {
        setError('Invalid or expired session. Please log in again.');
        localStorage.removeItem('token');
        navigate('/');
      }
    };
    verifyToken();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm sm:text-base">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden relative">
      {/* Hamburger Menu */}
      <motion.button
        className="md:hidden fixed top-4 left-4 z-20 bg-gradient-to-br from-purple-500 to-purple-700 shadow-md hover:shadow-purple-700 text-white p-3 rounded-xl"
        onClick={toggleSidebar}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial="hidden"
        animate={isSidebarOpen || window.innerWidth >= 768 ? 'visible' : 'hidden'}
        variants={sidebarVariants}
        className={`fixed z-10 top-0 left-0 h-full w-64 bg-gray-900 backdrop-blur-xl border-r border-purple-700/40 shadow-lg p-6 flex flex-col ${
          isSidebarOpen ? 'block' : 'hidden md:block'
        } overflow-y-auto`}
      >
        <div>
          <h2 className="text-2xl font-bold text-purple-400 mb-8">Admin Panel</h2>
          <ul className="space-y-2">
            {[
              { to: '/admin-dashboard/users', icon: <FaUsers />, label: 'Users' },
              { to: '/admin-dashboard/uploads', icon: <FaCode />, label: 'Uploads' },
              { to: '/admin-dashboard/contact-messages', icon: <FaEnvelope />, label: 'Contact Messages' },
            ].map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'text-purple-300 bg-purple-800/10 border-l-4 border-purple-500'
                        : 'text-gray-400 hover:text-purple-300 hover:bg-purple-700/10'
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {icon}
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <motion.button
          onClick={handleLogout}
          variants={linkVariants}
          whileHover="hover"
          className="cursor-pointer flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 w-full py-2 rounded-xl text-white font-semibold mt-16"
        >
          <FaSignOutAlt />
          Logout
        </motion.button>
      </motion.aside>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-5 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-64'} p-4 sm:p-8`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900 backdrop-blur-xl border border-purple-600/20 rounded-2xl p-4 sm:p-6 min-h-[calc(100vh-2rem)] shadow-xl"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;