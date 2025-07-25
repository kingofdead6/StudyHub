import React from 'react';
import { FileText, Lightbulb, Book, PencilRuler } from 'lucide-react';

const features = [
  {
    title: 'Generate Exams & Exercises',
    description:
      'Train smarter with automatically generated quizzes and practice exams tailored to your field and level.',
    icon: <FileText size={32} className="text-purple-400" />,
  },
  {
    title: 'Instant Solutions & Explanations',
    description:
      'Get clear, step-by-step solutions for every question you face — no more guessing or getting stuck.',
    icon: <Lightbulb size={32} className="text-purple-400" />,
  },
  {
    title: 'Access Your Courses Anytime',
    description:
      'Stay on top of your learning. Browse all your study materials and ask questions about any topic instantly.',
    icon: <Book size={32} className="text-purple-400" />,
  },
  {
    title: 'Build AI-Powered Resumés',
    description:
      'Create professional and optimized resumés with the help of AI — stand out in any application.',
    icon: <PencilRuler size={32} className="text-purple-400" />,
  },
];

const WhatWeDo = () => {
  return (
    <section className="bg-black text-white py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">What <span className='text-purple-500'>We</span> Do</h2>
        <p className="text-gray-400 mb-12">
          Your all-in-one AI companion for smarter studying, problem solving, and career building.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-b from-gray-900 via-gray-800 to-black p-6 rounded-2xl shadow-lg hover:shadow-purple-500/40 transition-transform transform hover:-translate-y-2 duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-purple-300 mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
