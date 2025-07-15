import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
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
          Study<span className='text-purple-400'>Hub</span>
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-purple-300 font-light">
          Smarter Learning, Powered by Intelligence.
        </p>
        <p className="mt-6 text-gray-300 max-w-xl mx-auto">
          Our AI-driven study assistant adapts to your learning style, helping you master complex topics faster and smarter.
        </p>
        <Link
          to="/aimachine"
          className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 transition rounded-xl text-white font-medium shadow-lg hover:shadow-purple-500 duration-300"
        >
            Get Started
        </Link>
      </div>
    </div>
  );
};

export default Hero;
