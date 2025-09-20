import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import StudentLogin from './Pages/StudentLogin';
import Forgetpass from './Pages/Forgetpass';
import Frontpage from './Pages/Frontpage';
import StudentDashboard from './Dashboards/StudentDashboard';
import FacultyDashboard from './Dashboards/FacultyDashboard';
import EmailInput from './Pages/EmailInput';
import Register from './Pages/Register';
import FacultyLogin from './Pages/FacultyLogin';
import NotFound from './Pages/NotFound';
import SecurityLogin from './Pages/SecurityLogin';
import SecurityDashboard from './Dashboards/SecurityDashboard';
import StudentEntryForm from './faculty/StudentEntryForm';

function App() {
  return (
    <AuthProvider>
      <Router basename='/GEN-C_LOGIN/'>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Frontpage />} />
          <Route path="/faculty-login" element={<FacultyLogin />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/security-login" element={<SecurityLogin />} />
          <Route path="/send-reset" element={<EmailInput />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<StudentLogin />} />
          <Route path="/forget" element={<Forgetpass />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty/*" element={<FacultyDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['security']} />}>
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['student']} />}>
            <Route path="/student/*" element={<StudentDashboard />} />
            <Route path="/StudentForm" element={<StudentEntryForm />} />
          </Route>

          {/* Catch all other routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
