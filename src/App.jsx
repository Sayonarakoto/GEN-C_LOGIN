import 'bootstrap/dist/css/bootstrap.min.css';

import { Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext'; // Removed as it's now in main.jsx
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
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import InterceptorWrapper from './components/InterceptorWrapper';
import { useAuth } from './hooks/useAuth'; // NEW IMPORT: Need useAuth here!

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
      <Route path="*" element={<ErrorPage title="404: Page Not Found" subTitle="It looks like the digital path disappeared! Double-check the URL or return home." />} />
    </Routes>
  );
};


function App() {
  // We need to call useAuth() outside the return to access the loading state
  const { loading } = useAuth(); // Access auth state

  // ✅ CRITICAL FIX: DO NOT render the routes until the AuthProvider finishes its work.
  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        Loading Application Data...
      </div>
    ); 
  }

  return (
    // The AuthProvider is now outside of App, likely in main.jsx
    // as per the stable structure from earlier, but we keep the logical flow here.
    // NOTE: This assumes App is wrapped by AuthProvider in main.jsx
    <>
      <InterceptorWrapper>
        <MainRoutes /> {/* Render the routes only when loading is false */}
      </InterceptorWrapper>
    </>
  );
}

export default App;