import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import HomePage from "./pages/HomePage";
import Navbar from "./component/shared/Navbar";
import LoginPage from "./component/Auth/LoginPage";
import RegisterPage from "./component/Auth/RegisterPage";
import AdminDashboard from "./component/Admin/AdminDashboard";
import AdminUsers from "./component/Admin/AdminUsers";
import AdminUploads from "./component/Admin/AdminUploads";
import AdminContact from "./component/Admin/AdminContact";
import NotFound from "./pages/NotFound";
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ChatPage from './pages/ChatPage';




function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route path="users" element={<AdminUsers />} />
          <Route path="uploads" element={<AdminUploads />} />
          <Route path="contact-messages" element={<AdminContact />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/LoginPage" element={<LoginPage />} />
          <Route path='/SignUp' element={<SignUpPage />} />
          <Route index element={<div/>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
