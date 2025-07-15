import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../../api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const inputVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.3 }
  },
  focus: {
    borderColor: 'rgba(147, 51, 234, 0.9)',
    boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)',
    transition: { duration: 0.3 }
  }
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token);
      console.log('API URL:', `${API_BASE_URL}/admin/users`);

      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Users response:', response.data);
      setUsers(response.data);
      setFilteredUsers(response.data);
      setLoading(false);
      toast.success('Users loaded successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      console.error('Fetch users error:', error.response || error);
      const message = error.response?.data?.message || 'Failed to load users. Please try again.';
      setError(message);
      setLoading(false);
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      toast.success('User deleted successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete user. Please try again.';
      setError(message);
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-purple-400 text-lg sm:text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm sm:text-base">
          <FaExclamationTriangle />
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6"
    >
      <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4 sm:mb-6">Users Management</h1>

      <div className="mb-4 sm:mb-6">
        <motion.div
          className="relative w-full max-w-sm "
          variants={inputVariants}
          whileHover="hover"
        >
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
        </motion.div>
      </div>

      <div className="overflow-x-auto">
        <div className="hidden sm:block">
          <table className="w-full text-gray-300 text-sm sm:text-base">
            <thead>
              <tr className="border-b border-purple-700/40">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Name</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Email</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Role</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Created At</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  variants={itemVariants}
                  className="border-b border-purple-700/20 hover:bg-purple-700/10"
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.name}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.email}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">{user.role}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(user.id)}
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                    >
                      <FaTrash />
                      Delete
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile layout: Stacked cards */}
        <div className="block sm:hidden space-y-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              variants={itemVariants}
              className="bg-gray-800 border border-purple-700/40 rounded-lg p-4 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-300 font-semibold text-sm">{user.name}</p>
                  <p className="text-gray-400 text-xs">{user.email}</p>
                  <p className="text-gray-400 text-xs">Role: {user.role}</p>
                  <p className="text-gray-400 text-xs">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(user.id)}
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs"
                >
                  <FaTrash />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center text-gray-400 mt-8 text-sm sm:text-base">
          No users found
        </div>
      )}
      <ToastContainer />
    </motion.div>
  );
};

export default AdminUsers;