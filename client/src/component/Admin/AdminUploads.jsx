import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaExclamationTriangle, FaSearch, FaPlus, FaTimes, FaFilePdf } from 'react-icons/fa';
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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

const popupVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

const AdminUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [formData, setFormData] = useState({
    link: '',
    year: '',
    universityYear: '',
    semester: '',
    module: '',
    type: '',
    speciality: '',
    solution: '',
  });
  const [formError, setFormError] = useState('');
  const [filterData, setFilterData] = useState({
    year: '',
    semester: '',
    type: '',
  });

  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: currentYear - 2000 +1 }, (_, i) => 2000 + i); 

  const fetchUploads = async () => {
    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams({
        year: filterData.year,
        semester: filterData.semester,
        type: filterData.type,
      }).toString();

      const response = await axios.get(`${API_BASE_URL}/admin/uploads?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Uploads response:', response.data);
      setUploads(response.data);
      setFilteredUploads(response.data);
      setLoading(false);
      toast.success('Uploads loaded successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      console.error('Fetch uploads error:', error.response || error);
      const message = error.response?.data?.message || 'Failed to load uploads. Please try again.';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError('');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (!formData.link || !formData.year || !formData.universityYear || !formData.semester || !formData.module || !formData.type) {
      setFormError('All required fields must be provided');
      return;
    }
    if (!['1', '2'].includes(formData.semester)) {
      setFormError('Semester must be 1 or 2');
      return;
    }
    if (!['1', '2', '3', '4', '5'].includes(formData.year)) {
      setFormError('Academic year must be between 1 and 5');
      return;
    }
    if (!yearRange.includes(Number(formData.universityYear))) {
      setFormError(`University year must be between 2000 and ${currentYear}`);
      return;
    }
    if (formData.year === '4' && !formData.speciality) {
      setFormError('Speciality is required for 4th year');
      return;
    }
    if (formData.year !== '4' && formData.speciality) {
      setFormError('Speciality should only be provided for 4th year');
      return;
    }
    if (formData.solution && !formData.solution.startsWith('https://drive.google.com/')) {
      setFormError('Solution must be a valid Google Drive link');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = { 
        ...formData,
        year: parseInt(formData.year),
        universityYear: parseInt(formData.universityYear),
        semester: parseInt(formData.semester),
        solution: formData.solution || null,
      };
      if (formData.year !== '4') {
        delete data.speciality;
      }
      if (!formData.solution) {
        delete data.solution;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/uploads`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUploads([response.data.upload, ...uploads]);
      setFilteredUploads([response.data.upload, ...filteredUploads]);
      setFormData({ link: '', year: '', universityYear: '', semester: '', module: '', type: '', speciality: '', solution: '' });
      setIsAddPopupOpen(false);
      setFormError('');
      toast.success('Upload added successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add upload. Please try again.';
      setFormError(message);
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

  const handleDelete = async (uploadId) => {
    if (!window.confirm('Are you sure you want to delete this upload?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/admin/uploads/${uploadId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const updatedUploads = uploads.filter(upload => upload.id !== uploadId);
      setUploads(updatedUploads);
      setFilteredUploads(updatedUploads);
      toast.success('Upload deleted successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete upload. Please try again.';
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

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchUploads();
  };

  // Extract Google Drive file ID from link
  const getThumbnailUrl = (link) => {
    const fileIdMatch = link.match(/\/d\/(.+?)\//) || link.match(/id=([^&]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w200` : null;
  };

  useEffect(() => {
    fetchUploads();
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
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-purple-400">Uploads Management</h1>
        <motion.button
          onClick={() => setIsAddPopupOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base"
        >
          <FaPlus />
          Add Upload
        </motion.button>
      </div>

      {/* Add Upload Popup */}
      <AnimatePresence>
        {isAddPopupOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsAddPopupOpen(false)}
            />
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-700/40 rounded-xl p-4 sm:p-6 w-[90%] max-w-md z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl text-gray-300">Add New Upload</h2>
                <motion.button
                  onClick={() => setIsAddPopupOpen(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer text-gray-400 hover:text-purple-300"
                >
                  <FaTimes size={20} />
                </motion.button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <motion.div variants={inputVariants} whileHover="hover">
                    <input
                      type="text"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="Google Drive PDF Link"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    />
                  </motion.div>
                  <motion.div variants={inputVariants} whileHover="hover">
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select Academic Year</option>
                      {[1, 2, 3, 4, 5].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </motion.div>
                  <motion.div variants={inputVariants} whileHover="hover">
                    <select
                      name="universityYear"
                      value={formData.universityYear}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select University Year</option>
                      {yearRange.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </motion.div>
                  <motion.div variants={inputVariants} whileHover="hover">
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </motion.div>
                  <motion.div variants={inputVariants} whileHover="hover">
                    <input
                      type="text"
                      name="module"
                      value={formData.module}
                      onChange={handleInputChange}
                      placeholder="Module Name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    />
                  </motion.div>
                  <motion.div variants={inputVariants} whileHover="hover">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select Type</option>
                      {['Interrogation', 'Intermediate Exam', 'Final Exam', 'TD', 'Course'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </motion.div>
                  {formData.year === '4' && (
                    <motion.div variants={inputVariants} whileHover="hover">
                      <select
                        name="speciality"
                        value={formData.speciality}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="">Select Speciality</option>
                        {['SID', 'SIL', 'SIQ', 'SIT'].map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                  {formData.type && formData.type !== 'Course' && (
                    <motion.div variants={inputVariants} whileHover="hover">
                      <input
                        type="text"
                        name="solution"
                        value={formData.solution}
                        onChange={handleInputChange}
                        placeholder="Solution PDF Link (Optional)"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                      />
                    </motion.div>
                  )}
                </div>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500 text-red-500 px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <FaExclamationTriangle />
                    {formError}
                  </motion.div>
                )}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full justify-center"
                >
                  <FaPlus />
                  Add Upload
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Details Popup */}
      <AnimatePresence>
        {selectedUpload && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedUpload(null)}
            />
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-700/40 rounded-xl p-4 sm:p-6 w-[90%] max-w-md z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl text-gray-300">Upload Details</h2>
                <motion.button
                  onClick={() => setSelectedUpload(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer text-gray-400 hover:text-purple-300"
                >
                  <FaTimes size={20} />
                </motion.button>
              </div>
              <div className="space-y-2 text-gray-300 text-sm sm:text-base">
                <p><span className="font-semibold">Module:</span> {selectedUpload.module}</p>
                <p><span className="font-semibold">Academic Year:</span> {selectedUpload.year}</p>
                <p><span className="font-semibold">University Year:</span> {selectedUpload.universityYear}</p>
                <p><span className="font-semibold">Semester:</span> {selectedUpload.semester}</p>
                <p><span className="font-semibold">Type:</span> {selectedUpload.type}</p>
                <p><span className="font-semibold">Speciality:</span> {selectedUpload.speciality || 'N/A'}</p>
                <p><span className="font-semibold">Solution:</span> {selectedUpload.solution ? (
                  <a href={selectedUpload.solution} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    View Solution
                  </a>
                ) : 'N/A'}</p>
                <p><span className="font-semibold">Created:</span> {new Date(selectedUpload.createdAt).toLocaleDateString()}</p>
              </div>
              <motion.a
                href={selectedUpload.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full justify-center"
              >
                <FaFilePdf />
                Open PDF
              </motion.a>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Form */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl text-gray-300 mb-4">Filter Uploads</h2>
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={inputVariants} whileHover="hover">
            <select
              name="year"
              value={filterData.year}
              onChange={handleFilterChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Academic Years</option>
              {[1, 2, 3, 4, 5].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </motion.div>
          <motion.div variants={inputVariants} whileHover="hover">
            <select
              name="semester"
              value={filterData.semester}
              onChange={handleFilterChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Semesters</option>
              {[1, 2].map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </motion.div>
          <motion.div variants={inputVariants} whileHover="hover">
            <select
              name="type"
              value={filterData.type}
              onChange={handleFilterChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-purple-700/40 rounded-lg text-gray-300 text-sm sm:text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Types</option>
              {['Interrogation', 'Intermediate Exam', 'Final Exam', 'TD', 'Course', 'Solution'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </motion.div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base sm:col-span-3 sm:justify-self-start"
          >
            <FaSearch />
            Apply Filters
          </motion.button>
        </form>
      </div>

      {/* Uploads Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUploads.map((upload) => (
          <motion.div
            key={upload.id}
            variants={itemVariants}
            className="bg-gray-800 border border-purple-700/40 rounded-lg p-4 shadow-md hover:shadow-purple-700/50 transition-shadow"
          >
            <div className="flex flex-col items-center">
              <div className="w-full h-48  overflow-hidden rounded-lg mb-2 bg-gray-700">
                <img
                  src={getThumbnailUrl(upload.link) || 'https://via.placeholder.com/150?text=PDF+Preview'}
                  alt="PDF Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=PDF+Preview')}
                />
              </div>
              <p className="text-gray-300 font-semibold text-sm sm:text-base text-center">{upload.module}</p>
              <p className="text-gray-400 text-xs sm:text-sm text-center">Year {upload.universityYear}</p>
              <div className="flex justify-between w-full mt-2">
                <motion.button
                  onClick={() => setSelectedUpload(upload)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  View Details
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(upload.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <FaTrash />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUploads.length === 0 && (
        <div className="text-center text-gray-400 mt-8 text-sm sm:text-base">
          No uploads found
        </div>
      )}
      <ToastContainer />
    </motion.div>
  );
};

export default AdminUploads;