import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../../api';
import StarsCanvas from '../canvas/stars';

// Password strength indicator component
const PasswordStrength = ({ password }) => {
  const getStrength = (password) => {
    if (!password) return { score: 0, text: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, text: "", color: "" },
      { score: 1, text: "Very Weak", color: "bg-red-500" },
      { score: 2, text: "Weak", color: "bg-orange-500" },
      { score: 3, text: "Fair", color: "bg-yellow-500" },
      { score: 4, text: "Good", color: "bg-blue-500" },
      { score: 5, text: "Strong", color: "bg-green-500" },
    ];

    return levels[score] || levels[0];
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${level <= strength.score ? strength.color : "bg-gray-700"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength.color.replace("bg-", "text-")}`}>{strength.text}</p>
    </div>
  );
};

// Error message component
const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 text-red-400 text-sm mt-1"
    >
      <AlertCircle className="w-4 h-4" />
      {message}
    </motion.div>
  );
};

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Debounced mouse tracking
  const handleMouseMove = useCallback((e) => {
    const formContainer = document.querySelector(".form-container");
    if (formContainer) {
      const rect = formContainer.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  useEffect(() => {
    const throttledMouseMove = (e) => {
      requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener("mousemove", throttledMouseMove);
    return () => window.removeEventListener("mousemove", throttledMouseMove);
  }, [handleMouseMove]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleBlur = useCallback(
    (field) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (touched[field]) {
        validateForm();
      }
    },
    [touched, validateForm],
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

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
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to login. Please try again.';
      setErrors({ submit: message });
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex mt-10">
      <div className="flex-1 flex items-center justify-center relative overflow-hidden form-container">
        <motion.div
          className="fixed w-96 h-96 rounded-full bg-gradient-to-r from-gray-700/5 to-gray-600/5 blur-3xl pointer-events-none z-0"
          animate={{
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-md mx-8"
        >
          <div className="backdrop-blur-xl bg-gray-900/20 border border-gray-700/30 rounded-3xl p-8 shadow-2xl">
            <motion.div
              className="text-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl mb-4"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Sparkles className="w-8 h-8 text-gray-100" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
                Welcome to StudySphere
              </h1>
              <p className="text-gray-400 mt-2">Sign in to your account to continue</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/30 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <AnimatePresence>
                  <ErrorMessage message={errors.email} />
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative"
              >
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  className="w-full pl-12 pr-12 py-3 bg-gray-900/30 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <AnimatePresence>
                  <ErrorMessage message={errors.password} />
                </AnimatePresence>
                <PasswordStrength password={form.password} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center text-gray-400 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded bg-gray-800 border-gray-600 focus:ring-gray-600" />
                  Remember me
                </label>
                <a
                  href="/forgot-password"
                  className="text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 rounded"
                >
                  Forgot password?
                </a>
              </motion.div>

              <AnimatePresence>
                {errors.submit && <ErrorMessage message={errors.submit} />}
              </AnimatePresence>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-gray-700 to-gray-900 text-gray-100 font-semibold rounded-xl hover:from-gray-800 hover:to-black focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-gray-700/25"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-gray-100 border-t-transparent rounded-full mx-auto"
                  />
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <p className="text-gray-400">
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="text-gray-300 hover:text-gray-100 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 rounded"
                >
                  Sign up
                </a>
              </p>
            </motion.div>
          </div>

          <motion.div
            className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-gray-700/10 to-gray-600/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-gray-800/10 to-gray-700/10 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </motion.div>
      </div>
      <ToastContainer />
      <StarsCanvas />
    </div>
  );
};

export default LoginPage;