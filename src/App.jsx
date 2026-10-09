import 'bootstrap/dist/css/bootstrap.min.css';

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/common/PageLoader';

import Frontpage from './Pages/Frontpage';
import InterceptorWrapper from './components/InterceptorWrapper';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider } from './context/NotificationContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Route-level code splitting: keep first paint small, load pages on demand
const StudentLogin = lazy(() => import('./Pages/StudentLogin'));
const FacultyLogin = lazy(() => import('./Pages/FacultyLogin'));
const SecurityLogin = lazy(() => import('./Pages/SecurityLogin'));
const AdminLogin = lazy(() => import('./Pages/AdminLogin'));
const StudentDashboard = lazy(() => import('./Dashboards/StudentDashboard'));
const DashboardHome = lazy(() =>
  import('./Dashboards/StudentDashboard').then((m) => ({ default: m.DashboardHome }))
);
const FacultyDashboard = lazy(() => import('./Dashboards/FacultyDashboard'));
const SecurityDashboard = lazy(() => import('./Dashboards/SecurityDashboard'));
const LibrarianDashboard = lazy(() => import('./Dashboards/LibrarianDashboard'));
const AdminDashboard = lazy(() => import('./Dashboards/AdminDashboard'));
const FacultyRegister = lazy(() => import('./Pages/FacultyRegister'));
const StudentRegister = lazy(() => import('./Pages/StudentRegister'));
const SecurityRegister = lazy(() => import('./Pages/SecurityRegister'));
const ErrorPage = lazy(() => import('./Pages/ErrorPage'));
const ForgotPassword = lazy(() => import('./Pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./Pages/ResetPassword'));
const ComingSoon = lazy(() => import('./Pages/ComingSoon'));
const StudentSpecialPassRequest = lazy(() => import('./student/StudentSpecialPassRequest'));
const FacultySpecialPasses = lazy(() => import('./faculty/FacultySpecialPasses'));
const StudentLateEntry = lazy(() => import('./student/StudentLateEntry'));
const StudentActiveGatePass = lazy(() => import('./student/StudentActiveGatePass'));
const FacultyGatePass = lazy(() => import('./faculty/FacultyGatePass'));
const StudentProfile = lazy(() => import('./student/StudentProfile'));
const DeclinedRequestDetails = lazy(() => import('./student/DeclinedRequestDetails'));
const LibraryActivationRequestForm = lazy(() => import('./components/common/LibraryActivationRequestForm'));
const BookBorrowRequest = lazy(() => import('./student/BookBorrowRequest'));

// Create a component to hold the main Routes logic
const MainRoutes = () => {
  return (
    <Suspense fallback={<PageLoader label="Loading page..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Frontpage />} />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/security-login" element={<SecurityLogin />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/faculty-register" element={<FacultyRegister />} />
        <Route path="/student-register" element={<StudentRegister />} />
        <Route path="/security-register" element={<SecurityRegister />} />
        <Route path="/librarian-register" element={<Navigate to="/library" replace />} />
        <Route path="/signin" element={<StudentLogin />} />
        <Route path="/unauthorized" element={<ErrorPage title="Access Denied" subTitle="You do not have permission to view this page. Please log in with an authorized account." />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/librarian-login" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<ComingSoon />} />
        <Route path="/librarian" element={<ComingSoon />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']} />}>
          <Route path="/faculty/*" element={<FacultyDashboard />} />
          <Route path="/faculty/special-passes" element={<FacultySpecialPasses />} />
          <Route path="/faculty/gate-pass" element={<FacultyGatePass />} />
          <Route path="/faculty/library-activation" element={<LibraryActivationRequestForm />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['SECURITY']} />}>
          <Route path="/security-dashboard" element={<SecurityDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['LIBRARIAN']} />}>
          <Route path="/librarian/dashboard" element={<LibrarianDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student" element={<StudentDashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="late-entry" element={<StudentLateEntry />} />
            <Route path="special-pass" element={<StudentSpecialPassRequest />} />
            <Route path="active-pass" element={<StudentActiveGatePass />} />
            <Route path="library-activation" element={<LibraryActivationRequestForm />} />
            <Route path="borrow-book" element={<BookBorrowRequest />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="request/edit/:requestId" element={<DeclinedRequestDetails />} />
            <Route path="submit-entry/:requestId" element={<StudentLateEntry />} />
          </Route>
        </Route>

        {/* Catch all other routes */}
        <Route path="*" element={<ErrorPage title="404: Page Not Found" subTitle="It looks like the digital path disappeared! Double-check the URL or return home." />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader label="Restoring your session..." />;
  }

  return (
    <>
      <NotificationProvider>
        <InterceptorWrapper>
          <MainRoutes />
        </InterceptorWrapper>
      </NotificationProvider>
      <PWAInstallPrompt />
    </>
  );
}

export default App;
