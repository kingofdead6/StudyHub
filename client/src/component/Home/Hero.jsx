import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';

// Animation variants for the input field
const inputVariants = {
  initial: { width: "200px", backgroundColor: "rgba(31, 41, 55, 0.5)" },
  focused: { width: "600px", backgroundColor: "rgba(31, 41, 55, 0.7)", transition: { duration: 0.5, ease: "easeInOut" } },
};

// Animation variants for buttons
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
};

const Hero = () => {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      try {
        const eventSource = new EventSource(
          `http://localhost:3001/chat?message=${encodeURIComponent(inputValue)}`
        );
        eventSource.onopen = () => {
          eventSource.close();
          navigate(`/chat?message=${encodeURIComponent(inputValue)}`);
          setInputValue("");
        };
        eventSource.onerror = () => {
          eventSource.close();
          navigate(`/chat?message=${encodeURIComponent(inputValue)}`);
          setInputValue("");
        };
      } catch (error) {
        navigate(`/chat?message=${encodeURIComponent(inputValue)}`);
        setInputValue("");
      }
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dtwa3lxdk/image/upload/v1752501295/20250714_1042_Futuristic_AI_Study_Space_simple_compose_01k044ykv7e35b0z82j1n39ddh_rigmh7.png')`,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
          Study<span className="text-purple-400">Hub</span>
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-purple-300 font-light">
          Understand answers. Master your courses. Boost productivity.
        </p>
        <p className="mt-6 text-gray-300 max-w-xl mx-auto">
          Our AI-driven study assistant adapts to your learning style, helping you master complex topics faster and smarter.
        </p>
        <motion.div
          className="flex flex-col sm:flex-row gap-6 mt-8 justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link to="/chat">
            <motion.button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-lg font-medium h-14 px-10 py-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variants={itemVariants}
            >
              Try StudyHub
            </motion.button>
          </Link>
          <a
            href="https://drive.google.com/drive/folders/1IwKUdm8qoyTIY0BW1lLAZlWI90G--0sa?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-lg font-medium h-14 px-10 py-3 bg-transparent border border-gray-300 text-white hover:bg-white hover:text-gray-900 transition-colors duration-300 shadow-lg"
            onClick={(e) => {
              window.open(e.currentTarget.href, '_blank');
              e.preventDefault();
            }}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            See Past Exams
          </a>
        </motion.div>
      </div>

      {/* Fixed Input Field */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 w-full p-6 lg:p-8 flex justify-center bg-gradient-to-t from-black to-transparent"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <motion.div
          className="flex items-center rounded-full p-2 shadow-2xl border border-gray-700"
          variants={inputVariants}
          animate={isInputFocused ? "focused" : "initial"}
        >
          <form onSubmit={handleSubmit} className="flex items-center w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Ask StudyHub..."
              className="flex-1 bg-transparent outline-none px-5 py-2 text-base text-gray-200 placeholder-gray-500"
            />
            <Link to={`/chat?message=${encodeURIComponent(inputValue)}`}>
              <motion.button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-medium h-10 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-colors duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </Link>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;