import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../../api'; // Adjust path based on your project structure

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const inputVariants = {
  hover: {
    scale: 1.02,
    boxShadow: '0 0 15px rgba(34, 211, 238, 0.7)',
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  focus: {
    borderColor: 'rgba(34, 211, 238, 0.9)',
    boxShadow: '0 0 20px rgba(34, 211, 238, 0.9)',
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', response.data.token);
      const role = response.data.user.role;
      toast.success('Login successful! Redirecting...', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }, 3000); // Redirect after 3 seconds
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to login. Please try again.';
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

  return (
    <section className="relative min-h-screen bg-gray-950 overflow-hidden flex flex-col justify-center">
      <style>{`
        .bg-container {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.3;
        }
        .bg-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(34, 211, 238, 0.2) 0%, rgba(17, 24, 39, 1) 70%);
        }
        .constellation-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(34, 211, 238, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          animation: twinkle 5s ease-in-out infinite;
        }
        .constellation-particle:nth-child(1) { top: 10%; left: 15%; animation-delay: 0s; }
        .constellation-particle:nth-child(2) { top: 20%; left: 80%; animation-delay: 1s; }
        .constellation-particle:nth-child(3) { top: 40%; left: 30%; animation-delay: 2s; }
        .constellation-particle:nth-child(4) { top: 60%; left: 70%; animation-delay: 3s; }
        .constellation-particle:nth-child(5) { top: 80%; left: 20%; animation-delay: 4s; }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .glass-container {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(34, 211, 238, 0.4);
        }
        .input-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(34, 211, 238, 0.4);
          color: white;
          transition: all 0.3s ease;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(34, 211, 238, 0.9);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.7);
        }
        .submit-button {
          background: linear-gradient(45deg, #22d3ee, #3b82f6);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.5);
        }
        .submit-button:hover {
          background: linear-gradient(45deg, #06b6d4, #2563eb);
          box-shadow: 0 0 25px rgba(34, 211, 238, 0.8);
        }
      `}</style>
      <div className="bg-container"></div>
      <div className="bg-overlay">
        <div className="constellation-particle"></div>
        <div className="constellation-particle"></div>
        <div className="constellation-particle"></div>
        <div className="constellation-particle"></div>
        <div className="constellation-particle"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="glass-container p-8 rounded-2xl"
        >
          <h2 className="text-3xl font-semibold text-white mb-6 text-center">Login to StudySphere</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              variants={inputVariants}
              whileHover="hover"
              className="input-field w-full px-4 py-3 rounded-lg text-white"
              required
            />
            <motion.input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              variants={inputVariants}
              whileHover="hover"
              className="input-field w-full px-4 py-3 rounded-lg text-white"
              required
            />
            <motion.button
              type="submit"
              variants={inputVariants}
              whileHover="hover"
              className="submit-button w-full px-6 py-3 text-base font-semibold text-white rounded-full transition-all duration-300"
            >
              Sign In
            </motion.button>
          </form>
          <p className="mt-4 text-center text-gray-300">
            Don't have an account?{' '}
            <a href="/register" className="text-cyan-300 hover:text-cyan-200">
              Register
            </a>
          </p>
        </motion.div>
      </div>
      <ToastContainer />
    </section>
  );
};

export default LoginPage;