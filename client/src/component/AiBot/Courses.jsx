"use client";

import { useState, useEffect, useContext, createContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Menu, FileText } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../../api";

const CoursesContext = createContext(null);

const CoursesProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <CoursesContext.Provider
      value={{
        uploads,
        setUploads,
        isSidebarVisible,
        setIsSidebarVisible,
        isSidebarExpanded,
        setIsSidebarExpanded,
        selectedCourse,
        setSelectedCourse,
        selectedChild,
        setSelectedChild,
        selectedSemester,
        setSelectedSemester,
        selectedSubject,
        setSelectedSubject,
        selectedType,
        setSelectedType,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
};

const Sidebar = () => {
  const {
    isSidebarVisible,
    selectedCourse,
    setSelectedCourse,
    selectedChild,
    setSelectedChild,
    selectedSemester,
    setSelectedSemester,
    selectedSubject,
    setSelectedSubject,
    selectedType,
    setSelectedType,
    setUploads,
    setIsLoading,
  } = useContext(CoursesContext);
  const [currentView, setCurrentView] = useState("main");

  const buttonVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const coursesData = [
    {
      title: "1 CP",
      id: "1CP",
      year: 1,
      semesters: [
        {
          title: "Semestre 1",
          id: "s1",
          semester: 1,
          subjects: [
            { title: "ANAL1", id: "ANAL1" },
            { title: "ALG1", id: "ALG1" },
            { title: "ALSDS", id: "ALSDS" },
            { title: "ARCHI1", id: "ARCHI1" },
            { title: "SYST1", id: "SYST1" },
            { title: "ELECT1", id: "ELECT1" },
            { title: "BWEB", id: "BWEB" },
            { title: "ANG1", id: "ANG1" },
            { title: "TEE", id: "TEE" },
          ],
        },
        {
          title: "Semestre 2",
          id: "s2",
          semester: 2,
          subjects: [
            { title: "ANAL2", id: "ANAL2" },
            { title: "ALG2", id: "ALG2" },
            { title: "ALSDD", id: "ALSDD" },
            { title: "SYST2", id: "SYST2" },
            { title: "ELECF", id: "ELECF" },
            { title: "TEO", id: "TEO" },
            { title: "MECA", id: "MECA" },
            { title: "ANG1", id: "ANG1" },
          ],
        },
      ],
    },
    {
      title: "2 CP",
      id: "2CP",
      year: 2,
      semesters: [
        {
          title: "Semestre 1",
          id: "s1",
          semester: 1,
          subjects: [
            { title: "ANAL3", id: "ANAL3" },
            { title: "ALG3", id: "ALG3" },
            { title: "SFSD", id: "SFSD" },
            { title: "PRST1", id: "PRST1" },
            { title: "ELECF2", id: "ELECF2" },
            { title: "ECON", id: "ECON" },
            { title: "ARCHI2", id: "ARCHI2" },
            { title: "ANG2", id: "ANG2" },
          ],
        },
        {
          title: "Semestre 2",
          id: "s2",
          semester: 2,
          subjects: [
            { title: "ANAL4", id: "ANAL4" },
            { title: "POO", id: "POO" },
            { title: "PRST2", id: "PRST2" },
            { title: "PRJP", id: "PRJP" },
            { title: "SINF", id: "SINF" },
            { title: "LOGM", id: "LOGM" },
            { title: "OPTOE", id: "OPTOE" },
            { title: "ANG3", id: "ANG3" },
          ],
        },
      ],
    },
    {
      title: "1 CS",
      id: "1CS",
      year: 3,
      semesters: [
        {
          title: "Semestre 1",
          id: "s1",
          semester: 1,
          subjects: [
            { title: "ANUM", id: "ANUM" },
            { title: "SYC1", id: "SYC1" },
            { title: "IGL", id: "IGL" },
            { title: "RO", id: "RO" },
            { title: "THP", id: "THP" },
            { title: "ORGA", id: "ORGA" },
            { title: "RES1", id: "RES1" },
            { title: "ANG", id: "ANG" },
          ],
        },
        {
          title: "Semestre 2",
          id: "s2",
          semester: 2,
          subjects: [
            { title: "ARCHI3", id: "ARCHI3" },
            { title: "CPRJ", id: "CPRJ" },
            { title: "ANG3", id: "ANG3" },
            { title: "RES2", id: "RES2" },
            { title: "PROJET-1CS", id: "PROJET-1CS" },
            { title: "BDD", id: "BDD" },
            { title: "MCSI", id: "MCSI" },
            { title: "SEC", id: "SEC" },
            { title: "SYC2", id: "SYC2" },
          ],
        },
      ],
    },
    {
      title: "2 CS",
      id: "2CS",
      year: 4,
      children: [
        {
          title: "SID",
          id: "SID",
          type: "track",
          speciality: "SID",
          semesters: [
            {
              title: "Semestre 1",
              id: "s1",
              semester: 1,
              subjects: [
                { title: "HPC", id: "HPC" },
                { title: "ML", id: "ML" },
                { title: "ANAD", id: "ANAD" },
                { title: "BDA", id: "BDA" },
                { title: "TSG", id: "TSG" },
                { title: "CRP", id: "CRP" },
                { title: "INFOVIS", id: "INFOVIS" },
                { title: "MASD", id: "MASD" },
                { title: "SGOV", id: "SGOV" },
              ],
            },
            {
              title: "Semestre 2",
              id: "s2",
              semester: 2,
              subjects: [
                { title: "RV", id: "RV" },
                { title: "BI", id: "BI" },
                { title: "IMN", id: "IMN" },
                { title: "PMSS", id: "PMSS" },
                { title: "TOAI", id: "TOAI" },
                { title: "IRIAD", id: "IRIAD" },
                { title: "RCR", id: "RCR" },
                { title: "TALN", id: "TALN" },
              ],
            },
          ],
        },
        {
          title: "SIL",
          id: "SIL",
          type: "track",
          speciality: "SIL",
          semesters: [
            {
              title: "Semestre 1",
              id: "s1",
              semester: 1,
              subjects: [
                { title: "IHM", id: "IHM" },
                { title: "MAGIL", id: "MAGIL" },
                { title: "STAGE", id: "STAGE" },
                { title: "TPGO", id: "TPGO" },
                { title: "PDC", id: "PDC" },
                { title: "WEB", id: "WEB" },
                { title: "OUTILS", id: "OUTILS" },
                { title: "COMPIL", id: "COMPIL" },
                { title: "ANAD", id: "ANAD" },
              ],
            },
            {
              title: "Semestre 2",
              id: "s2",
              semester: 2,
              subjects: [
                { title: "MBL2", id: "MBL2" },
                { title: "BDM", id: "BDM" },
                { title: "QLOG", id: "QLOG" },
                { title: "ENTPIHM", id: "ENTPIHM" },
                { title: "MNG", id: "MNG" },
                { title: "ALOG", id: "ALOG" },
                { title: "BDA", id: "BDA" },
              ],
            },
          ],
        },
        {
          title: "SIQ",
          id: "SIQ",
          type: "track",
          speciality: "SIQ",
          semesters: [
            {
              title: "Semestre 1",
              id: "s1",
              semester: 1,
              subjects: [
                { title: "RESA", id: "RESA" },
                { title: "STAGE", id: "STAGE" },
                { title: "TPGO", id: "TPGO" },
                { title: "COMPIL", id: "COMPIL" },
                { title: "ANAD", id: "ANAD" },
                { title: "FAS", id: "FAS" },
              ],
            },
            {
              title: "Semestre 2",
              id: "s2",
              semester: 2,
              subjects: [
                { title: "SSR", id: "SSR" },
                { title: "SYSR", id: "SYSR" },
                { title: "BDA", id: "BDA" },
                { title: "PROJET-2CS", id: "PROJET-2CS" },
                { title: "OPTM", id: "OPTM" },
                { title: "ALOG", id: "ALOG" },
              ],
            },
          ],
        },
        {
          title: "SIT",
          id: "SIT",
          type: "track",
          speciality: "SIT",
          semesters: [
            {
              title: "Semestre 1",
              id: "s1",
              semester: 1,
              subjects: [
                { title: "AQUA", id: "AQUA" },
                { title: "ASI", id: "ASI" },
                { title: "TICO", id: "TICO" },
                { title: "BDA", id: "BDA" },
                { title: "MPSI", id: "MPSI" },
                { title: "SIAD", id: "SIAD" },
                { title: "ANAD", id: "ANAD" },
              ],
            },
            {
              title: "Semestre 2",
              id: "s2",
              semester: 2,
              subjects: [
                { title: "PROJET 2CS", id: "PROJET 2CS" },
                { title: "SIC", id: "SIC" },
                { title: "MSSI", id: "MSSI" },
                { title: "Projet FASI", id: "Projet FASI" },
                { title: "COFI", id: "COFI" },
                { title: "AL", id: "AL" },
                { title: "ERP", id: "ERP" },
              ],
            },
          ],
        },
        {
          title: "modules optionnels",
          id: "optional-modules",
          type: "optional",
          subjects: [
            { title: "RV", id: "RV" },
            { title: "VCL", id: "VCL" },
            { title: "VEILLE(SIL)", id: "VEILLE(SIL)" },
            { title: "URBA", id: "URBA" },
            { title: "TPGO(SIL)", id: "TPGO(SIL)" },
            { title: "VEILLE", id: "VEILLE" },
            { title: "TSG", id: "TSG" },
            { title: "Programation-Mobile", id: "Programation-Mobile" },
            { title: "TICO(SIL)", id: "TICO(SIL)" },
            { title: "SIG(SIL)", id: "SIG(SIL)" },
            { title: "ML", id: "ML" },
            { title: "Programmation-web", id: "Programmation-web" },
            { title: "SEMB", id: "SEMB" },
            { title: "IPLS(SIL)", id: "IPLS(SIL)" },
            { title: "MNG", id: "MNG" },
            { title: "SIG", id: "SIG" },
            { title: "MSS", id: "MSS" },
            { title: "AUDIT", id: "AUDIT" },
            { title: "COFI(SIQ)", id: "COFI(SIQ)" },
            { title: "BI", id: "BI" },
            { title: "HPC", id: "HPC" },
            { title: "IPLS", id: "IPLS" },
            { title: "BDM", id: "BDM" },
            { title: "IMN", id: "IMN" },
            { title: "IHM", id: "IHM" },
            { title: "AQUA", id: "AQUA" },
            { title: "ENTP", id: "ENTP" },
          ],
        },
      ],
    },
    {
      title: "3 CS",
      id: "3CS",
      year: 5,
      semesters: [
        {
          title: "Semestre 1",
          id: "s1",
          semester: 1,
          subjects: [
            { title: "CS Sub 3.1", id: "CS Sub 3.1" },
            { title: "CS Sub 3.2", id: "CS Sub 3.2" },
          ],
        },
        {
          title: "Semestre 2",
          id: "s2",
          semester: 2,
          subjects: [
            { title: "CS Sub 3.3", id: "CS Sub 3.3" },
            { title: "CS Sub 3.4", id: "CS Sub 3.4" },
          ],
        },
      ],
    },
  ];

  const subjectDetailsOptions = [
    { title: "Course", id: "Course" },
    { title: "TD", id: "TD" },
    { title: "EMD", id: "EMD" },
  ];

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    if (course.children) {
      setCurrentView("children");
    } else {
      setCurrentView("semesters");
      setSelectedChild(null);
    }
    setSelectedSemester(null);
    setSelectedSubject(null);
    setSelectedType(null);
    setUploads([]);
  };

  const handleChildClick = (child) => {
    setSelectedChild(child);
    if (child.type === "optional") {
      setCurrentView("subjects");
      setSelectedSemester({ id: "optional-direct", title: "Optional Modules" });
    } else {
      setCurrentView("semesters");
    }
    setSelectedSubject(null);
    setSelectedType(null);
    setUploads([]);
  };

  const handleSemesterClick = (semester) => {
    setSelectedSemester(semester);
    setCurrentView("subjects");
    setSelectedSubject(null);
    setSelectedType(null);
    setUploads([]);
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setCurrentView("subject-details");
    setSelectedType(null);
    setUploads([]);
  };

  const handleTypeClick = async (type) => {
    setSelectedType(type);
    setIsLoading(true);
    toast.info(`Loading ${type.title} PDFs for ${selectedSubject.title}`, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });

    try {
      const queryParams = {
        year: selectedCourse.year,
        semester: selectedSemester.semester,
        module: selectedSubject.id,
        type: type.id,
      };
      if (selectedChild && selectedChild.speciality) {
        queryParams.speciality = selectedChild.speciality;
      }

      const response = await axios.get(`${API_BASE_URL}/chat/uploads`, {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const uploads = response.data;
      setUploads(uploads);
      if (uploads.length === 0) {
        toast.warn("No PDFs found for the selected criteria", {
          position: "bottom-right",
          autoClose: 3000,
          theme: "dark",
        });
      } else {
        toast.success(`Loaded ${uploads.length} PDFs`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (err) {
      console.error("Error fetching PDFs:", err);
      toast.error(err.response?.data?.message || "Failed to load PDFs", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "dark",
      });
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentView === "subject-details") {
      setCurrentView("subjects");
      setSelectedSubject(null);
      setSelectedType(null);
      setUploads([]);
    } else if (currentView === "subjects") {
      if (selectedChild && selectedChild.type === "optional") {
        setCurrentView("children");
        setSelectedSemester(null);
        setSelectedType(null);
        setUploads([]);
      } else if (selectedChild) {
        setCurrentView("semesters");
        setSelectedSemester(null);
        setSelectedType(null);
        setUploads([]);
      } else if (selectedCourse) {
        setCurrentView("semesters");
        setSelectedSemester(null);
        setSelectedType(null);
        setUploads([]);
      }
    } else if (currentView === "semesters") {
      if (selectedChild) {
        setCurrentView("children");
        setSelectedChild(null);
        setSelectedType(null);
        setUploads([]);
      } else {
        setCurrentView("main");
        setSelectedCourse(null);
        setSelectedType(null);
        setUploads([]);
      }
      setSelectedSemester(null);
    } else if (currentView === "children") {
      setCurrentView("main");
      setSelectedCourse(null);
      setSelectedChild(null);
      setSelectedType(null);
      setUploads([]);
    }
  };

  const getSidebarTitle = () => {
    if (currentView === "main") {
      return "Courses";
    } else if (currentView === "children" && selectedCourse) {
      return selectedCourse.title;
    } else if (currentView === "semesters" && selectedCourse) {
      return selectedChild ? `${selectedCourse.title} - ${selectedChild.title}` : selectedCourse.title;
    } else if (currentView === "subjects" && selectedCourse) {
      if (selectedChild && selectedChild.type === "optional") {
        return `${selectedCourse.title} - ${selectedChild.title}`;
      } else if (selectedChild && selectedSemester) {
        return `${selectedCourse.title} - ${selectedChild.title} - ${selectedSemester.title}`;
      } else if (selectedSemester) {
        return `${selectedCourse.title} - ${selectedSemester.title}`;
      }
    } else if (currentView === "subject-details" && selectedSubject) {
      let parentTitle = "";
      if (selectedChild && selectedChild.type === "optional") {
        parentTitle = `${selectedCourse.title} - ${selectedChild.title}`;
      } else if (selectedChild && selectedSemester) {
        parentTitle = `${selectedCourse.title} - ${selectedChild.title} - ${selectedSemester.title}`;
      } else if (selectedSemester) {
        parentTitle = `${selectedCourse.title} - ${selectedSemester.title}`;
      }
      return `${parentTitle} - ${selectedSubject.title}`;
    }
    return "Courses";
  };

  const getSubjectsForSelectedSemester = () => {
    if (selectedChild && selectedChild.type === "optional") {
      return selectedChild.subjects;
    }
    if (selectedChild && selectedSemester) {
      const semester = selectedChild.semesters.find((s) => s.id === selectedSemester.id);
      return semester ? semester.subjects : [];
    }
    if (!selectedChild && selectedCourse && selectedSemester) {
      const semester = selectedCourse.semesters.find((s) => s.id === selectedSemester.id);
      return semester ? semester.subjects : [];
    }
    return [];
  };

  return (
    <AnimatePresence>
      {isSidebarVisible && (
        <motion.div
          className="w-72 h-full bg-gray-900 text-gray-100 p-6 flex flex-col shadow-2xl rounded-r-3xl"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-700 bg-clip-text text-transparent">
            {getSidebarTitle()}
          </h2>
          <AnimatePresence mode="wait">
            {currentView === "main" && (
              <motion.div
                key="main-courses"
                className="space-y-4 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {coursesData.map((course) => (
                  <motion.div key={course.id} variants={buttonVariants}>
                    <motion.button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-base font-semibold h-12 px-5 py-3 w-full justify-start bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 hover:from-blue-600 hover:to-purple-600 transition-colors duration-300 shadow-lg"
                      onClick={() => handleCourseClick(course)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {course.title}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "children" && selectedCourse && selectedCourse.children && (
              <motion.div
                key="children"
                className="space-y-4 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <motion.button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </motion.button>
                </motion.div>
                {selectedCourse.children.map((child) => (
                  <motion.div key={child.id} variants={buttonVariants}>
                    <motion.button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleChildClick(child)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {child.title}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "semesters" && selectedCourse && (
              <motion.div
                key="semesters"
                className="space-y-4 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <motion.button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </motion.button>
                </motion.div>
                {(selectedChild?.semesters || selectedCourse?.semesters)?.map((semester) => (
                  <motion.div key={semester.id} variants={buttonVariants}>
                    <motion.button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleSemesterClick(semester)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {semester.title}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "subjects" && selectedCourse && (
              <motion.div
                key="subjects"
                className="space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <motion.button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </motion.button>
                </motion.div>
                {getSubjectsForSelectedSemester().map((subject) => (
                  <motion.div key={subject.id} variants={buttonVariants}>
                    <motion.button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleSubjectClick(subject)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {subject.title}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "subject-details" && selectedSubject && (
              <motion.div
                key="subject-details"
                className="space-y-4 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <motion.button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </motion.button>
                </motion.div>
                {subjectDetailsOptions.map((option) => (
                  <motion.div key={option.id} variants={buttonVariants}>
                    <motion.button
                      className={`inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 shadow-sm ${
                        selectedType?.id === option.id ? "bg-gray-800 text-gray-100" : ""
                      }`}
                      onClick={() => handleTypeClick(option)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {option.title}
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PdfCard = ({ upload }) => {
  return (
    <motion.a
      href={upload.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label={`Open PDF for university year ${upload.universityYear}`}
    >
      <div className="relative w-full h-48 bg-gray-700">
        {upload.thumbnail ? (
          <img
            src={upload.thumbnail}
            alt={`University year ${upload.universityYear} preview`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-600 to-gray-800">
            <FileText className="h-16 w-16 text-red-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-100 truncate">Year {upload.universityYear}</h3>
        <p className="text-sm text-gray-400 mt-1">Click to view PDF</p>
      </div>
    </motion.a>
  );
};

const Quote = () => {
  const quote = "Discover your course materials with ease.";
  return (
    <motion.div
      className="flex items-center justify-center h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <p className="text-xl font-medium text-gray-300 max-w-md text-center bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        {quote.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
          >
            {char}
          </motion.span>
        ))}
      </p>
    </motion.div>
  );
};

const HamburgerToggle = () => {
  const { isSidebarVisible, setIsSidebarVisible } = useContext(CoursesContext);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className="fixed top-4 left-4 z-50 p-3 rounded-full bg-gray-900/90 hover:bg-gray-800 cursor-pointer transition-colors duration-200 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait">
        {isHovered ? (
          <motion.div
            key="arrow"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {isSidebarVisible ? (
              <ChevronLeft className="h-7 w-7 text-gray-200" />
            ) : (
              <ChevronRight className="h-7 w-7 text-gray-200" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hamburger"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-7 w-7 text-gray-200" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CoursesPage = () => {
  const { uploads, isLoading } = useContext(CoursesContext);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <HamburgerToggle />
        <div className="flex-1 p-8 overflow-hidden flex flex-col pt-16">
          {uploads.length === 0 && !isLoading && <Quote />}
          <div className="h-full pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <motion.div
                  className="rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.map((upload) => (
                  <PdfCard key={upload.id} upload={upload} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

const CoursesPageWithProvider = () => (
  <CoursesProvider>
    <CoursesPage />
  </CoursesProvider>
);

export default CoursesPageWithProvider;
