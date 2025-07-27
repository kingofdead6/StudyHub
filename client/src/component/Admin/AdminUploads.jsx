import React, { useEffect, useState, useCallback } from 'react';
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
  const [formData, setFormData] = useState({
    file: null,
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
    module: '',
  });
  const [filtersApplied, setFiltersApplied] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearRange = Array.from({ length: currentYear - 2000 + 6 }, (_, i) => 2000 + i);

  const fetchUploads = useCallback(async (applyFilters = false) => {
    console.log('Starting fetchUploads, applyFilters:', applyFilters);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        throw new Error('No authentication token found');
      }

      let query = '';
      if (applyFilters) {
        query = new URLSearchParams({
          year: filterData.year,
          semester: filterData.semester,
          type: filterData.type,
          module: filterData.module,
        }).toString();
      }

      console.log('Fetching uploads with query:', query || 'none');

      const response = await axios.get(`${API_BASE_URL}/admin/uploads${query ? `?${query}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Uploads response received:', {
        status: response.status,
        dataLength: response.data.length,
        data: response.data
      });

      response.data.forEach(upload => {
        console.log(`Upload: id=${upload.id}, link=${upload.link}, module=${upload.module}, type=${upload.type}`);
      });

      setUploads(response.data);
      setFilteredUploads(response.data);
      console.log('State updated:', { uploads: response.data.length, filteredUploads: response.data.length });

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
      console.error('Fetch uploads error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response data'
      });
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
  }, [filterData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name}=${value}`);
    setFormData({ ...formData, [name]: value });
    setFormError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file');
    if (file && file.type !== 'application/pdf') {
      console.warn('Invalid file type:', file.type);
      setFormError('Please upload a PDF file');
      return;
    }
    setFormData({ ...formData, file });
    setFormError('');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name}=${value}`);
    setFilterData({ ...filterData, [name]: value });
    setFiltersApplied(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started', formData);

    if (!formData.file || !formData.year || !formData.universityYear || !formData.semester || !formData.module || !formData.type) {
      console.warn('Validation failed: Missing required fields', formData);
      setFormError('All required fields must be provided');
      return;
    }

    if (!['1', '2'].includes(formData.semester)) {
      console.warn('Validation failed: Invalid semester', formData.semester);
      setFormError('Semester must be 1 or 2');
      return;
    }

    if (!['1', '2', '3', '4', '5'].includes(formData.year)) {
      console.warn('Validation failed: Invalid year', formData.year);
      setFormError('Academic year must be between 1 and 5');
      return;
    }

    if (!yearRange.includes(Number(formData.universityYear))) {
      console.warn('Validation failed: Invalid universityYear', formData.universityYear);
      setFormError(`University year must be between 2000 and ${currentYear + 5}`);
      return;
    }

    if (!['Course', 'TD', 'EMD'].includes(formData.type)) {
      console.warn('Validation failed: Invalid type', formData.type);
      setFormError('Type must be Course, TD, or EMD');
      return;
    }

    if (formData.year === '4' && !['SID', 'SIL', 'SIQ', 'SIT'].includes(formData.speciality)) {
      console.warn('Validation failed: Invalid speciality for 4th year', formData.speciality);
      setFormError('Speciality must be SID, SIL, SIQ, or SIT for 4th year');
      return;
    }

    if (formData.year !== '4' && formData.speciality) {
      console.warn('Validation failed: Speciality provided for non-4th year', formData.speciality);
      setFormError('Speciality should only be provided for 4th year');
      return;
    }

    if (formData.solution && !formData.solution.startsWith('https://drive.google.com/')) {
      console.warn('Validation failed: Invalid solution link', formData.solution);
      setFormError('Solution must be a valid Google Drive link');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        throw new Error('No authentication token found');
      }

      const data = new FormData();
      data.append('file', formData.file);
      data.append('year', parseInt(formData.year));
      data.append('universityYear', parseInt(formData.universityYear));
      data.append('semester', parseInt(formData.semester));
      data.append('module', formData.module);
      data.append('type', formData.type);
      if (formData.year === '4' && formData.speciality) {
        data.append('speciality', formData.speciality);
      }
      if (formData.solution) {
        data.append('solution', formData.solution);
      }

      console.log('Submitting FormData:');
      for (let [key, value] of data.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await axios.post(`${API_BASE_URL}/admin/uploads`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', {
        status: response.status,
        data: response.data
      });

      setUploads([response.data.upload, ...uploads]);
      setFilteredUploads([response.data.upload, ...filteredUploads]);
      setFormData({ file: null, year: '', universityYear: '', semester: '', module: '', type: '', speciality: '', solution: '' });
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
      console.error('Submit error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response data'
      });
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
    console.log('Initiating delete for upload:', uploadId);
    if (!window.confirm('Are you sure you want to delete this upload?')) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        throw new Error('No authentication token found');
      }

      console.log('Sending delete request for upload:', uploadId);
      await axios.delete(`${API_BASE_URL}/admin/uploads/${uploadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedUploads = uploads.filter(upload => upload.id !== uploadId);
      setUploads(updatedUploads);
      setFilteredUploads(updatedUploads);
      console.log('State updated after delete:', { uploads: updatedUploads.length, filteredUploads: updatedUploads.length });
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
      console.error('Delete error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response data'
      });
      const message = error.response?.data?.message || 'Failed to delete upload. Please try again.';
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

  const applyFilters = useCallback(() => {
    console.log('Applying filters, filtersApplied:', filtersApplied, 'filterData:', filterData);
    if (!filtersApplied) {
      console.log('No filters applied, resetting to all uploads');
      setFilteredUploads(uploads);
      return;
    }

    let filtered = [...uploads];
    if (filterData.year) {
      filtered = filtered.filter(upload => upload.year === parseInt(filterData.year));
      console.log('Filtered by year:', filterData.year, 'Results:', filtered.length);
    }
    if (filterData.semester) {
      filtered = filtered.filter(upload => upload.semester === parseInt(filterData.semester));
      console.log('Filtered by semester:', filterData.semester, 'Results:', filtered.length);
    }
    if (filterData.type) {
      filtered = filtered.filter(upload => upload.type === filterData.type);
      console.log('Filtered by type:', filterData.type, 'Results:', filtered.length);
    }
    if (filterData.module) {
      filtered = filtered.filter(upload => upload.module && upload.module.toLowerCase().includes(filterData.module.toLowerCase()));
      console.log('Filtered by module:', filterData.module, 'Results:', filtered.length);
    }
    console.log('Final filtered uploads:', { count: filtered.length, uploads: filtered.map(u => ({ id: u.id, link: u.link })) });
    setFilteredUploads(filtered);
  }, [filterData, uploads, filtersApplied]);

  const testLink = (link) => {
    console.log('Testing link:', link);
    window.open(link, '_blank');
  };

  useEffect(() => {
    console.log('Initial fetchUploads triggered');
    fetchUploads();
  }, [fetchUploads]);

  useEffect(() => {
    console.log('applyFilters effect triggered');
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    console.log('State change detected:', { uploads: uploads.length, filteredUploads: filteredUploads.length });
  }, [uploads, filteredUploads]);

  return (
    <div className="min-h-screen text-gray-100 p-6">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
        Manage Uploads
      </h1>

      {/* Filters */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 flex flex-wrap gap-4"
      >
        <motion.div variants={itemVariants} className="flex-1 min-w-[150px]">
          <motion.input
            type="number"
            name="year"
            value={filterData.year}
            onChange={handleFilterChange}
            placeholder="Filter by Academic Year"
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="flex-1 min-w-[150px]">
          <motion.select
            name="semester"
            value={filterData.semester}
            onChange={handleFilterChange}
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          >
            <option value="">Filter by Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </motion.select>
        </motion.div>
        <motion.div variants={itemVariants} className="flex-1 min-w-[150px]">
          <motion.select
            name="type"
            value={filterData.type}
            onChange={handleFilterChange}
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          >
            <option value="">Filter by Type</option>
            <option value="Course">Course</option>
            <option value="TD">TD</option>
            <option value="EMD">EMD</option>
          </motion.select>
        </motion.div>
        <motion.div variants={itemVariants} className="flex-1 min-w-[150px]">
          <motion.input
            type="text"
            name="module"
            value={filterData.module}
            onChange={handleFilterChange}
            placeholder="Filter by Module"
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none"
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          />
        </motion.div>
        <motion.button
          variants={itemVariants}
          className="p-2 rounded bg-gradient-to-r from-gray-700 to-black text-gray-100"
          onClick={() => fetchUploads(true)}
        >
          <FaSearch />
        </motion.button>
      </motion.div>

      {/* Add Upload Button */}
      <motion.div
        variants={itemVariants}
        className="mb-6"
      >
        <button
          className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-gray-700 to-black text-gray-100"
          onClick={() => setIsAddPopupOpen(true)}
        >
          <FaPlus /> Add New Upload
        </button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 text-red-400 mb-4"
        >
          <FaExclamationTriangle /> {error}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          variants={itemVariants}
          className="text-center text-gray-400"
        >
          Loading...
        </motion.div>
      )}

      {/* Uploads List */}
      {!loading && filteredUploads.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center text-gray-400"
        >
          No uploads found.
        </motion.div>
      )}

      {!loading && filteredUploads.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredUploads.map((upload) => (
            <motion.div
              key={upload.id}
              variants={itemVariants}
              className="p-4 rounded bg-gray-800 border border-gray-700 flex flex-col justify-between"
              style={{ minHeight: '200px' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaFilePdf className="text-red-400" />
                  <a
                    href={upload.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 hover:underline"
                  >
                    {upload.module || 'Unknown Module'} ({upload.type || 'Unknown Type'})
                  </a>
                </div>
                <p className="text-sm text-gray-400">Year: {upload.year || 'N/A'}</p>
                <p className="text-sm text-gray-400">University Year: {upload.universityYear || 'N/A'}</p>
                <p className="text-sm text-gray-400">Semester: {upload.semester || 'N/A'}</p>
                {upload.speciality && (
                  <p className="text-sm text-gray-400">Speciality: {upload.speciality}</p>
                )}
                {upload.solution && (
                  <p className="text-sm text-gray-400">
                    Solution:{' '}
                    <a
                      href={upload.solution}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Google Drive
                    </a>
                  </p>
                )}
               
              </div>
              <button
                className="mt-4 p-2 rounded bg-red-600 text-white flex items-center gap-2 justify-center"
                onClick={() => handleDelete(upload.id)}
              >
                <FaTrash /> Delete
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Upload Popup */}
      <AnimatePresence>
        {isAddPopupOpen && (
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
          >
            <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100">Add New Upload</h2>
                <button
                  onClick={() => setIsAddPopupOpen(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                />
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="Academic Year (1-5)"
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                />
                <input
                  type="number"
                  name="universityYear"
                  value={formData.universityYear}
                  onChange={handleInputChange}
                  placeholder="University Year (e.g., 2023)"
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                />
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
                <input
                  type="text"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  placeholder="Module (e.g., ANAL1)"
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                >
                  <option value="">Select Type</option>
                  <option value="Course">Course</option>
                  <option value="TD">TD</option>
                  <option value="EMD">EMD</option>
                </select>
                {formData.year === '4' && (
                  <select
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleInputChange}
                    className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                  >
                    <option value="">Select Speciality</option>
                    <option value="SID">SID</option>
                    <option value="SIL">SIL</option>
                    <option value="SIQ">SIQ</option>
                    <option value="SIT">SIT</option>
                  </select>
                )}
                <input
                  type="text"
                  name="solution"
                  value={formData.solution}
                  onChange={handleInputChange}
                  placeholder="Solution Google Drive Link (Optional)"
                  className="mb-4 w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-700"
                />
                {formError && (
                  <div className="flex items-center gap-2 text-red-400 mb-4">
                    <FaExclamationTriangle /> {formError}
                  </div>
                )}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="p-2 rounded bg-gradient-to-r from-gray-700 to-black text-gray-100 flex-1"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddPopupOpen(false)}
                    className="p-2 rounded bg-gray-600 text-gray-100 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUploads;