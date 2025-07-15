import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaExclamationTriangle, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
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

const AdminContact = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setContacts(response.data);
      setFilteredContacts(response.data);
      setLoading(false);
      toast.success('Contacts loaded successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to load contacts. Please try again.';
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

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/contacts/${contactId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const updatedContacts = contacts.filter(contact => contact.id !== contactId);
      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
      toast.success('Contact deleted successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete contact. Please try again.';
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

  const handleToggleSeen = async (contactId, currentStatus) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/contacts/${contactId}/seen`,
        { isSeen: !currentStatus },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      const updatedContacts = contacts.map(contact =>
        contact.id === contactId ? { ...contact, isSeen: !currentStatus } : contact
      );
      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
      toast.success(response.data.message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update contact status. Please try again.';
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
    const filtered = contacts.filter(
      contact =>
        contact.fullName.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query)
    );
    setFilteredContacts(filtered);
  };

  useEffect(() => {
    fetchContacts();
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
      <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4 sm:mb-6">Contact Messages</h1>

      <div className="mb-4 sm:mb-6">
        <motion.div
          className="relative w-full max-w-sm"
          variants={inputVariants}
          whileHover="hover"
        >
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredContacts.map((contact) => (
          <motion.div
            key={contact.id}
            variants={cardVariants}
            className="bg-gray-900 border border-purple-700/40 rounded-xl p-6 shadow-lg hover:shadow-purple-500/20 transition-shadow duration-300"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-purple-300">{contact.fullName}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${contact.isSeen ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  {contact.isSeen ? 'Seen' : 'Unread'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{contact.email}</p>
              <p className="text-gray-300 text-sm line-clamp-3">{contact.message}</p>
              <p className="text-gray-500 text-xs">
                Created: {new Date(contact.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggleSeen(contact.id, contact.isSeen)}
                  className={`cursor-pointer flex-1 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2 ${contact.isSeen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {contact.isSeen ? <FaEyeSlash /> : <FaEye />}
                  {contact.isSeen ? 'Mark Unread' : 'Mark Seen'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(contact.id)}
                  className="cursor-pointer flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <FaTrash />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center text-gray-400 mt-8 text-sm sm:text-base">
          No contact messages found
        </div>
      )}
      <ToastContainer />
    </motion.div>
  );
};

export default AdminContact;