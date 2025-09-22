import 'bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLogin from './Pages/StudentLogin';
import Frontpage from './Pages/Frontpage';
import StudentDashboard from './Dashboards/StudentDashboard';
import FacultyDashboard from './Dashboards/FacultyDashboard';
import Register from './Pages/Register';
import FacultyLogin from './Pages/FacultyLogin';
import ErrorPage from './Pages/ErrorPage';
import SecurityLogin from './Pages/SecurityLogin';
import SecurityDashboard from './Dashboards/SecurityDashboard';
 // New import
import ForgotPassword from './Pages/ForgotPassword'; // New import
import ResetPassword from './Pages/ResetPassword'; // New import

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
          <Route path="/register" element={<Register />} />
          <Route path="/signin" element={<StudentLogin />} />
          <Route path="/unauthorized" element={<ErrorPage status="403" title="403" subTitle="Sorry, you are not authorized to access this page." />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* New route */}
          <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* New route */}

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty/*" element={<FacultyDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['security']} />}>
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/*" element={<StudentDashboard />} />
          </Route>

          {/* Catch all other routes */}
          <Route path="*" element={<ErrorPage status="404" title="404" subTitle="Sorry, the page you visited does not exist." />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;