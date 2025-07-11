import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaFileUpload, FaFilePdf, FaSpinner, FaCheckCircle, FaExclamationCircle, FaTrash } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
import * as pdfjsLib from 'pdfjs-dist';
import { API_BASE_URL } from '../../../api';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.js',
  import.meta.url
).toString();



// Animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const Try = () => {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ uploaded: false, filename: '', error: '' });

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = {
        text: "Welcome to the Exam Assistant! Upload a PDF and/or ask a question to generate exams or get explanations.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setTypingMessage({ ...initialMessage, displayedText: '' });
    }
  }, [messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

  // Focus textarea on open
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Typing animation for bot responses
  useEffect(() => {
    if (typingMessage) {
      const { text, displayedText } = typingMessage;
      if (displayedText.length < text.length) {
        const timeout = setTimeout(() => {
          setTypingMessage(prev => ({
            ...prev,
            displayedText: text.slice(0, displayedText.length + 1),
          }));
        }, 20);
        return () => clearTimeout(timeout);
      } else {
        setMessages(prev => [...prev, { ...typingMessage, text }]);
        setTypingMessage(null);
      }
    }
  }, [typingMessage]);

  // Clear uploaded PDF
  const handleClearPdf = () => {
    setUploadedFile(null);
    setUploadStatus({ uploaded: false, filename: '', error: '' });
    fileInputRef.current.value = null;
    setMessages(prev => [
      ...prev,
      {
        text: 'PDF cleared.',
        isBot: false,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Handle file upload and optional question submission
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setUploadStatus({ uploaded: false, filename: '', error: 'No file selected.' });
      setMessages(prev => [
        ...prev,
        {
          text: 'No file selected. Please choose a PDF.',
          isBot: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (file.type !== 'application/pdf') {
      setUploadStatus({ uploaded: false, filename: '', error: 'Invalid file type. Please upload a PDF.' });
      setMessages(prev => [
        ...prev,
        {
          text: 'Invalid file type. Please upload a PDF.',
          isBot: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    setUploadedFile(file);
    setUploadStatus({ uploaded: true, filename: file.name, error: '' });

    // Render first page of PDF
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const pdfData = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);
        const scale = 0.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        const pdfPreview = canvas.toDataURL('image/png');

        setMessages(prev => [
          ...prev,
          {
            text: `Uploaded PDF: ${file.name}`,
            isBot: false,
            timestamp: new Date().toISOString(),
            pdfPreview,
          },
        ]);

        const formData = new FormData();
        formData.append('pdf', file);
        if (input.trim()) {
          formData.append('message', input.trim());
        }

        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/chatbot/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (response.ok) {
            setTypingMessage({
              text: data.message,
              isBot: true,
              timestamp: new Date().toISOString(),
              displayedText: '',
              pdfUrl: data.pdfUrl ? `${data.pdfUrl}` : null,
            });
            if (input.trim()) {
              setInput('');
            }
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (error) {
          setTypingMessage({
            text: `Failed to upload PDF: ${error.message}`,
            isBot: true,
            timestamp: new Date().toISOString(),
            displayedText: '',
          });
          setUploadStatus({ uploaded: false, filename: '', error: error.message });
          setUploadedFile(null);
          fileInputRef.current.value = null;
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        setTypingMessage({
          text: `Error processing PDF: ${error.message}`,
          isBot: true,
          timestamp: new Date().toISOString(),
          displayedText: '',
        });
        setUploadStatus({ uploaded: false, filename: '', error: error.message });
        setUploadedFile(null);
        fileInputRef.current.value = null;
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setUploadStatus({ uploaded: false, filename: '', error: 'Failed to read file.' });
      setMessages(prev => [
        ...prev,
        {
          text: 'Failed to read PDF file.',
          isBot: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = {
      text: trimmedInput,
      isBot: false,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedInput, uploadedFile: uploadedFile?.name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        text: data.reply,
        isBot: true,
        timestamp: new Date().toISOString(),
        displayedText: '',
        pdfUrl: data.pdfUrl && (trimmedInput.toLowerCase().includes('solution') || trimmedInput.toLowerCase().includes('solve')) ? `${data.pdfUrl}` : null,
      };
      setTypingMessage(botMessage);
    } catch (error) {
      setTypingMessage({
        text: `Error processing request: ${error.message}`,
        isBot: true,
        timestamp: new Date().toISOString(),
        displayedText: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-cyan-600 p-4 flex items-center space-x-3">
        <FaRobot className="text-2xl" />
        <h1 className="text-2xl font-bold">Exam Assistant</h1>
      </header>

      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        {messages.map((message, index) => (
          <motion.div
            key={`${message.timestamp}-${index}`}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.isBot ? 'bg-gray-800' : 'bg-cyan-500'
              }`}
            >
              <p className="leading-relaxed">{message.text}</p>
              {message.pdfPreview && (
                <img
                  src={message.pdfPreview}
                  alt="PDF Preview"
                  className="mt-2 max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
              )}
              {message.pdfUrl && (
                <a
                  href={message.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center mt-2"
                >
                  <FaFilePdf className="mr-1" /> View Solution PDF
                </a>
              )}
              <p className="text-xs mt-1 opacity-70">{formatTime(message.timestamp)}</p>
            </div>
          </motion.div>
        ))}
        {typingMessage && (
          <motion.div
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
            className="flex justify-start mb-4"
          >
            <div className="max-w-[80%] p-4 rounded-lg bg-gray-800">
              <p className="leading-relaxed">{typingMessage.displayedText}</p>
              {typingMessage.pdfUrl && (
                <a
                  href={typingMessage.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center mt-2"
                >
                  <FaFilePdf className="mr-1" /> View Solution PDF
                </a>
              )}
              <p className="text-xs mt-1 opacity-70">{formatTime(typingMessage.timestamp)}</p>
            </div>
          </motion.div>
        )}
        {isLoading && !typingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="p-4 rounded-lg bg-gray-800">
              <div className="flex space-x-2">
                <FaSpinner className="animate-spin text-cyan-400" />
                <span>Processing...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-6 bg-gray-800 border-t border-gray-700">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            {uploadStatus.uploaded ? (
              <>
                <FaCheckCircle className="text-green-400" />
                <span>PDF: {uploadStatus.filename} uploaded</span>
              </>
            ) : (
              <>
                <FaExclamationCircle className={uploadStatus.error ? 'text-red-400' : 'text-gray-400'} />
                <span>{uploadStatus.error || 'No PDF uploaded'}</span>
              </>
            )}
            {uploadStatus.uploaded && (
              <motion.button
                onClick={handleClearPdf}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-1 text-red-400 hover:text-red-500 focus:outline-none"
                title="Clear uploaded PDF"
              >
                <FaTrash className="text-sm" />
              </motion.button>
            )}
          </div>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for an exam, explanation, or solution..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows="3"
                style={{ minHeight: '80px', maxHeight: '150px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                disabled={isLoading}
              />
            </div>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="p-3 bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading}
            >
              <FaFileUpload className="text-lg" />
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <motion.button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className={`p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                !input.trim() || isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              <IoMdSend className="text-lg" />
            </motion.button>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #06b6d4;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 #374151;
        }
      `}</style>
    </div>
  );
};

export default Try;