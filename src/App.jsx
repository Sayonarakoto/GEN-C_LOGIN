import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route,Navigate } from 'react-router-dom';
import Signup from './Pages/Signup';
import Forgetpass from './Pages/Forgetpass';
import Frontpage from './Pages/Frontpage';
import StudentDashboard from './Dashbaords/StudentDashboard';
import FacultyDashboard from './Dashbaords/FacultyDashboard';
import StudentEntryForm from './faculty/StudentEntryForm';
import EmailInput from './Pages/EmailInput';
import Register from './Pages/Register';
import FacultyLogin from './Pages/FacultyLogin';
import NotFound from './Pages/NotFound';
function App() {
  return (
    <Router basename='/GEN-C_LOGIN/'>
      <Routes>
        <Route path="/" element={<Frontpage />} />   {/* 👈 changed from /home */}
        <Route path="/send-reset" element={<EmailInput />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<Signup />} />
        <Route path='/faculty-login' element={<FacultyLogin/>} />
        <Route path="/forget" element={<Forgetpass />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/StudentForm" element={<StudentEntryForm />} />
        <Route path='/security-login' element={</>}
        <Route path="*" element={
          <Navigate to="/404" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
