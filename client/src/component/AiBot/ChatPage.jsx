"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronLeft, ChevronRight, User, Bot, Menu, Upload, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { API_BASE_URL } from "../../../api";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatContext = createContext(null);

const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const addMessage = (message, isUser) => {
    setMessages((prev) => [...prev, { text: message, isUser }]);
  };

  const updateLastMessage = (newText) => {
    setMessages((prev) => {
      const updatedMessages = [...prev];
      if (updatedMessages.length > 0) {
        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          text: newText,
        };
      } else {
        updatedMessages.push({ text: newText, isUser: false });
      }
      return updatedMessages;
    });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        updateLastMessage,
        isSidebarExpanded,
        setIsSidebarExpanded,
        isSidebarVisible,
        setIsSidebarVisible,
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
      }}
    >
      {children}
    </ChatContext.Provider>
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
  } = useContext(ChatContext);
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
  };

  const handleSemesterClick = (semester) => {
    setSelectedSemester(semester);
    setCurrentView("subjects");
    setSelectedSubject(null);
    setSelectedType(null);
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setCurrentView("subject-details");
    setSelectedType(null);
  };

  const handleTypeClick = (type) => {
    setSelectedType(type);
    // Notify user that PDFs are being loaded into the AI context
    toast.info(`Loading ${type.title} PDFs for ${selectedSubject.title}`, {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark',
    });
  };

  const handleBack = () => {
    if (currentView === "subject-details") {
      setCurrentView("subjects");
      setSelectedSubject(null);
      setSelectedType(null);
    } else if (currentView === "subjects") {
      if (selectedChild && selectedChild.type === "optional") {
        setCurrentView("children");
        setSelectedSemester(null);
        setSelectedType(null);
      } else if (selectedChild) {
        setCurrentView("semesters");
        setSelectedSemester(null);
        setSelectedType(null);
      } else if (selectedCourse) {
        setCurrentView("semesters");
        setSelectedSemester(null);
        setSelectedType(null);
      }
    } else if (currentView === "semesters") {
      if (selectedChild) {
        setCurrentView("children");
        setSelectedChild(null);
        setSelectedType(null);
      } else {
        setCurrentView("main");
        setSelectedCourse(null);
        setSelectedType(null);
      }
      setSelectedSemester(null);
    } else if (currentView === "children") {
      setCurrentView("main");
      setSelectedCourse(null);
      setSelectedChild(null);
      setSelectedType(null);
    }
  };

  const getSidebarTitle = () => {
    if (currentView === "main") {
      return "ESi Hub";
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
    return "Esi Hub";
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
          className="w-64 h-full bg-black text-gray-100 p-4 flex flex-col shadow-lg rounded-r-2xl"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
            {getSidebarTitle()}
          </h2>
          <AnimatePresence mode="wait">
            {currentView === "main" && (
              <motion.div
                key="main-courses"
                className="space-y-3 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {coursesData.map((course) => (
                  <motion.div key={course.id} variants={buttonVariants}>
                    <button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start bg-gradient-to-r from-gray-700 to-gray-900 text-gray-100 hover:from-gray-800 hover:to-black transition-colors duration-200 shadow-md"
                      onClick={() => handleCourseClick(course)}
                    >
                      {course.title}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "children" && selectedCourse && selectedCourse.children && (
              <motion.div
                key="children"
                className="space-y-3 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </button>
                </motion.div>
                {selectedCourse.children.map((child) => (
                  <motion.div key={child.id} variants={buttonVariants}>
                    <button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleChildClick(child)}
                    >
                      {child.title}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "semesters" && selectedCourse && (
              <motion.div
                key="semesters"
                className="space-y-3 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </button>
                </motion.div>
                {(selectedChild?.semesters || selectedCourse?.semesters)?.map((semester) => (
                  <motion.div key={semester.id} variants={buttonVariants}>
                    <button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleSemesterClick(semester)}
                    >
                      {semester.title}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "subjects" && selectedCourse && (
              <motion.div
                key="subjects"
                className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </button>
                </motion.div>
                {getSubjectsForSelectedSemester().map((subject) => (
                  <motion.div key={subject.id} variants={buttonVariants}>
                    <button
                      className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {subject.title}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {currentView === "subject-details" && selectedSubject && (
              <motion.div
                key="subject-details"
                className="space-y-3 flex-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                <motion.div variants={buttonVariants}>
                  <button
                    className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Back
                  </button>
                </motion.div>
                {subjectDetailsOptions.map((option) => (
                  <motion.div key={option.id} variants={buttonVariants}>
                    <button
                      className={`inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 transition-colors duration-200 shadow-sm ${
                        selectedType?.id === option.id ? 'bg-gray-900 text-gray-100' : ''
                      }`}
                      onClick={() => handleTypeClick(option)}
                    >
                      {option.title}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-auto pt-4">
            <button className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-gray-100 shadow-sm">
              <Settings className="mr-3 h-5 w-5" /> Account Settings
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Quote = () => {
  const quote = "The only way to do great work is to love what you do.";
  return (
    <motion.div
      className="flex items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <p className="text-lg font-medium text-gray-400 max-w-md text-center">
        {quote.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {char}
          </motion.span>
        ))}
      </p>
    </motion.div>
  );
};

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

const ChatMessage = ({ text, isUser }) => (
  <motion.div
    className={`flex items-start gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {!isUser && (
      <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-black">
        <div className="flex h-full w-full items-center justify-center rounded-full text-gray-100">
          <Bot className="h-4 w-4" />
        </div>
      </div>
    )}
    <div
      className={`max-w-[75%] p-3 rounded-2xl shadow-md ${
        isUser
          ? "bg-gradient-to-r from-gray-700 to-black text-gray-100 rounded-br-none"
          : "bg-gray-800 text-gray-200 rounded-bl-none"
      }`}
    >
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {text}
        </ReactMarkdown>
      </div>
    </div>
    {isUser && (
      <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-black">
        <div className="flex h-full w-full items-center justify-center rounded-full text-gray-100">
          <User className="h-4 w-4" />
        </div>
      </div>
    )}
  </motion.div>
);

const ChatInput = () => {
  const { addMessage, updateLastMessage, selectedCourse, selectedChild, selectedSemester, selectedSubject, selectedType } = useContext(ChatContext);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Please enter a message');
      return;
    }

    const userMessage = input.trim();
    addMessage(userMessage, true);
    setInput('');
    setError('');

    try {
      addMessage('', false);
      const queryParams = new URLSearchParams({
        message: userMessage,
      });

      if (selectedCourse && selectedSemester && selectedSubject && selectedType) {
        queryParams.append('year', selectedCourse.year);
        queryParams.append('semester', selectedSemester.semester);
        queryParams.append('module', selectedSubject.id);
        queryParams.append('type', selectedType.id);
        if (selectedChild && selectedChild.speciality) {
          queryParams.append('speciality', selectedChild.speciality);
        }
      }

      const eventSource = new EventSource(
        `${API_BASE_URL}/chat/chat?${queryParams.toString()}`
      );

      let streamedReply = '';

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          return;
        }
        streamedReply += event.data + ' ';
        updateLastMessage(streamedReply.trim());
      };

      eventSource.addEventListener('error', (err) => {
        console.error('SSE error:', err);
        updateLastMessage('⚠️ Error receiving stream');
        eventSource.close();
        toast.error('Failed to receive chat response', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'dark',
        });
      });

      eventSource.addEventListener('done', () => {
        eventSource.close();
      });
    } catch (err) {
      console.error('Chat error:', err);
      updateLastMessage('⚠️ Error initiating chat');
      toast.error('Failed to initiate chat', {
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    addMessage(`📄 Uploaded PDF: ${file.name}`, true);
    addMessage('', false);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/chat/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split('\n\n');

        for (const event of events) {
          if (event.startsWith('data:')) {
            const word = event.replace('data: ', '').trim();
            if (word === '[DONE]') {
              break;
            }
            streamedReply += word + ' ';
            updateLastMessage(streamedReply.trim());
          } else if (event.startsWith('event: done')) {
            break;
          } else if (event.startsWith('event: error')) {
            const errorMsg = event.replace('event: error\ndata: ', '').trim();
            throw new Error(errorMsg || 'Failed to process PDF');
          }
        }
      }

      toast.success('PDF processed successfully', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    } catch (err) {
      console.error('PDF upload error:', err);
      updateLastMessage('⚠️ Error uploading PDF');
      toast.error(err.message || 'Failed to upload PDF', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="relative">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mt-4 mb-4 mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="backdrop-blur-xl bg-gray-900/20 border border-gray-700/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder="Type your message..."
              className="flex-1 outline-none px-3 py-2 bg-transparent text-gray-100 placeholder-gray-500 focus:ring-0 text-sm border-none"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'chat-error' : undefined}
            />
            <motion.button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 bg-gradient-to-r from-gray-700 to-black text-gray-100 hover:from-gray-800 hover:to-black shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send
            </motion.button>
            <motion.button
              type="button"
              onClick={triggerFileInput}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 bg-gradient-to-r from-gray-700 to-black text-gray-100 hover:from-gray-800 hover:to-black shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="h-4 w-4 mr-2" /> Upload PDF
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              className="hidden"
            />
          </div>
          <AnimatePresence>
            <ErrorMessage message={error} />
          </AnimatePresence>
        </div>
      </motion.form>
      <ToastContainer />
    </div>
  );
};

const HamburgerToggle = () => {
  const { isSidebarVisible, setIsSidebarVisible } = useContext(ChatContext);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      className="fixed top-4 left-4 z-50 p-2 rounded-full bg-gray-900 hover:bg-gray-800 cursor-pointer transition-colors duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
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
            <Menu className="h-5 w-5 text-gray-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ChatPage = () => {
  const { messages } = useContext(ChatContext);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-black text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <HamburgerToggle />
        <div className="flex-1 p-6 overflow-hidden flex flex-col pt-16">
          {messages.length === 0 && <Quote />}
          <div className="h-full pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
            {messages.map((msg, index) => (
              <ChatMessage key={index} text={msg.text} isUser={msg.isUser} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-6">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

const ChatPageWithProvider = () => (
  <ChatProvider>
    <ChatPage />
  </ChatProvider>
);

export default ChatPageWithProvider;