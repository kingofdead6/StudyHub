import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../../api'; // Adjust path based on your project structure

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrollUp, setScrollUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  // Check authentication and user role
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setIsLoggedIn(true);
          setUserName(response.data.name || 'User');
          setIsAdmin(response.data.role === 'admin');
        })
        .catch((error) => {
          console.error('Error fetching profile:', error);
          setIsLoggedIn(false);
          setUserName('');
          setIsAdmin(false);
          localStorage.removeItem('token'); // Clear invalid token
          navigate('/login');
        });
    }
  }, [navigate]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollUp(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Hide navbar for admin users
  if (isAdmin) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
        scrollUp ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <nav className="backdrop-blur-lg bg-black/30 text-white px-6 md:px-12 py-4 shadow-sm flex justify-between items-center">
        {/* Logo */}
        <div className="text-4xl font-bold tracking-tight">
          Study<span className="text-purple-400">Sphere</span>
        </div>

        {/* Right Side */}
        <div className="space-x-4">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition text-lg font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="cursor-pointer px-4 py-2 rounded-xl bg-transparent border border-purple-500 hover:bg-purple-800 text-lg font-medium"
              >
                Register
              </Link>
            </>
          ) : (
            <span className="text-purple-200 font-medium text-sm">Welcome, {userName}</span>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;