import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../../api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/contacts`, formData);
      toast.success(response.data.message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
      setFormData({ fullName: '', email: '', message: '' });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to submit contact form';
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-20 flex items-center justify-center">
      <motion.div
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: '200% 50%' }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        className="p-1 rounded-2xl bg-gradient-to-r from-purple-500 via-transparent to-purple-500 bg-[length:200%_200%]"
      >
        <div className="w-full max-w-3xl bg-gray-900 p-10 rounded-2xl shadow-2xl border border-purple-700/20">
          <h2 className="text-4xl font-bold text-purple-400 text-center mb-8">Contact Us</h2>
          <p className="text-gray-400 text-center mb-12">
            We'd love to hear from you! Fill out the form and our team will get back to you shortly.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-purple-300">Your Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-purple-300">Your Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-purple-300">Your Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Write your message here..."
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 transition rounded-xl text-white font-medium shadow-lg hover:shadow-purple-500 duration-300 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
      <ToastContainer />
    </div>
  );
};

export default ContactPage;