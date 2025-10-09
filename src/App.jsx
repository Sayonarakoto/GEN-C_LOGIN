import 'bootstrap/dist/css/bootstrap.min.css';

import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLogin from './Pages/StudentLogin';
import Frontpage from './Pages/Frontpage';
import StudentDashboard, { DashboardHome } from './Dashboards/StudentDashboard';
import FacultyDashboard from './Dashboards/FacultyDashboard';
import Register from './Pages/Register';
import FacultyLogin from './Pages/FacultyLogin';
import ErrorPage from './Pages/ErrorPage';
import SecurityLogin from './Pages/SecurityLogin';
import SecurityDashboard from './Dashboards/SecurityDashboard';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import InterceptorWrapper from './components/InterceptorWrapper';
import { useAuth } from './hooks/useAuth';
import StudentSpecialPassRequest from './student/StudentSpecialPassRequest';
import FacultySpecialPasses from './faculty/FacultySpecialPasses';
import StudentLateEntry from './student/StudentLateEntry'; // Added import
import StudentActiveGatePass from './student/StudentActiveGatePass';
import FacultyGatePass from './faculty/FacultyGatePass';
import StudentProfile from './student/StudentProfile';
import DeclinedRequestDetails from './student/DeclinedRequestDetails';

// Create a component to hold the main Routes logic
const MainRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Frontpage />} />
      <Route path="/faculty-login" element={<FacultyLogin />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/security-login" element={<SecurityLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signin" element={<StudentLogin />} />
      <Route path="/unauthorized" element={<ErrorPage title="Access Denied" subTitle="You do not have permission to view this page. Please log in with an authorized account." />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']} />}>
        <Route path="/faculty/*" element={<FacultyDashboard />} />
        <Route path="/faculty/special-passes" element={<FacultySpecialPasses />} />
        <Route path="/faculty/gate-pass" element={<FacultyGatePass />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['SECURITY']} />}>
        <Route path="/security-dashboard" element={<SecurityDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="late-entry" element={<StudentLateEntry />} />
          <Route path="special-pass" element={<StudentSpecialPassRequest />} />
          <Route path="active-pass" element={<StudentActiveGatePass />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="request/edit/:requestId" element={<DeclinedRequestDetails />} />
          <Route path="submit-entry/:requestId" element={<StudentLateEntry />} />
        </Route>
      </Route>

      {/* Catch all other routes */}
      <Route path="*" element={<ErrorPage title="404: Page Not Found" subTitle="It looks like the digital path disappeared! Double-check the URL or return home." />} />
    </Routes>
  );
};


function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        Loading Application Data...
      </div>
    ); 
  }

  return (
    <>
      <InterceptorWrapper>
        <MainRoutes />
      </InterceptorWrapper>
    </>
  );
}

export default App;