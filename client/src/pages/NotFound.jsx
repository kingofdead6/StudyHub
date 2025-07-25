import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: { scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

const NotFound = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6"
    >
      <div className="text-center">
        <motion.div
          variants={iconVariants}
          className="mb-6 flex justify-center"
        >
          <FaExclamationTriangle className="text-purple-400 text-6xl sm:text-8xl" />
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-400 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-400 text-base sm:text-lg mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 transition rounded-xl text-white font-medium shadow-lg hover:shadow-purple-500 duration-300"
        >
          Return to Home
        </Link>
      </div>
    </motion.div>
  );
};

export default NotFound;