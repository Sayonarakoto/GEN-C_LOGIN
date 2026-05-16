import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Row, Col, Card, Button, Spinner, Alert,
  Offcanvas, Nav, Badge, Form
} from 'react-bootstrap';
import Avatar from '@mui/material/Avatar';
import {
  Menu as MenuIcon,
  NotificationsOutlined,
  AddOutlined,
  StarOutlined,
  PersonOutlined,
  DescriptionOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  DashboardOutlined,
  ListAltOutlined,
  LogoutOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  CardMembership,
  LibraryBooks,
} from '@mui/icons-material';
import BookBorrowRequest from '../student/BookBorrowRequest';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import useToastService from '../hooks/useToastService';
import api from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import NotificationList from '../components/NotificationList';
import { resolveProfileImageUrl } from '../utils/resolveProfileImageUrl';

import './Dashboard.css';

// --- Helper Functions ---

const getStatusStyle = (status) => {
  switch (status) {
    case 'Pending': return { color: 'var(--warning-color)', icon: null };
    // Assuming 'Approved (Final)' or just 'Approved' is successful
    case 'Approved':
    case 'Approved (Final)':
    case 'Approved (Internal)':
        return { color: 'var(--success-color)', icon: <CheckCircleOutlined style={{ color: 'var(--success-color)' }} /> };
    case 'Declined':
    case 'Rejected':
    case 'Used': // Include 'Used' as a non-active status for visibility
        return { color: 'var(--error-color)', icon: <CancelOutlined style={{ color: 'var(--error-color)' }} /> };
    default: return { color: 'var(--text-primary)', icon: null };
  }
};

// --- QuickActions Component ---

const QuickActions = () => {
  const actions = [
    { icon: <AddOutlined />, label: "New Gate Pass", path: "active-pass" },
    { icon: <StarOutlined />, label: "Special Pass", path: "special-pass" },
    { icon: <PersonOutlined />, label: "Late Comer", path: "late-entry" },
    { icon: <LibraryBooks />, label: "Activate Library ID", path: "library-activation" },
    { icon: <DescriptionOutlined />, label: "Borrow Book", path: "borrow-book" }
  ];

  return (
    <div>
      <h5 style={{ marginBottom: 12 }}>Quick Actions</h5>
      <Row xs={1} sm={2} md={3} className="g-3 mb-4">
        {actions.map((q) => (
          <Col key={q.label}>
            <NavLink to={q.path} style={{ textDecoration: 'none' }}>
              <Card className="quick-action-card">
                <Card.Body className="d-flex flex-column justify-content-center align-items-center gap-2">
                  <div className="quick-action-icon">{q.icon}</div>
                  <p className="fw-bold">{q.label}</p>
                </Card.Body>
              </Card>
            </NavLink>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// --- RequestHistory Component (FIXED: Handling combined requests) ---

const RequestHistory = ({ loading, error, requests, navigate }) => {
  if (loading) return <Spinner animation="border" size="lg" className="mt-3 d-block mx-auto" />;
  if (error) return <Alert variant="danger" className="mt-3">Error: {error}</Alert>;
  if (requests.length === 0) {
    return (
      <Card className="text-center p-4 request-history-card">
        <p>No recent request activity found.</p>
      </Card>
    );
  }
  return (
    <div className="d-flex flex-column gap-3 mt-3">
      {requests.map((r) => {
        const { color, icon } = getStatusStyle(r.status);

        // Use the 'reason' property if mapped in DashboardHome,
        // fallback to 'request_reason' if mapping was skipped/different
        const reasonText = r.reason || r.request_reason || 'No Reason Provided';

        return (
          <Card key={r._id} className="request-history-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                <DescriptionOutlined className="request-history-icon" />
                <div className="text-truncate">
                  {/* Display the Type (Late Comer or Special Pass) */}
                  <p className="mb-0 fw-bold text-truncate">{r.type || 'Request'}</p>
                  <p className="mb-0 text-truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{reasonText}</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <p className="mb-0 fw-bold" style={{ color, fontSize: 14 }}>{r.status}</p>
                {icon}
                {(r.status === 'Declined' || r.status === 'Rejected') && r.type !== 'Special Pass' && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to edit/resubmit page, using the unique ID
                      navigate(`request/edit/${r._id}`);
                    }}
                  >
                    Resubmit
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

// --- DashboardHome Component (FIXED: Combined Fetch Logic) ---

export const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToastService();
  const { addNotification } = useNotifications(); // Import useNotifications
  const [recentPasses, setRecentPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Late Comers
      const lateComerResponse = await api.get('/latecomers/mine');
      const lateComers = (lateComerResponse.data?.entries || []).map(entry => ({
        ...entry,
        _id: entry._id,
        type: 'Late Comer',
        reason: entry.reason,
        createdAt: entry.timestamp,
        status: entry.status,
      }));

      // 2. Fetch Special Passes
      const specialPassResponse = await api.get('/special-passes/student');

      const rawSpecialPassData = specialPassResponse.data.data
        || specialPassResponse.data.entries 
        || specialPassResponse.data;

      const specialPasses = (Array.isArray(rawSpecialPassData) ? rawSpecialPassData : [])
        .map(pass => {
            if (!pass._id || !pass.requested_at) return null;
            return {
                ...pass,
                _id: pass._id,
                type: 'Special Pass',
                reason: pass.request_reason || 'No specific reason provided',
                createdAt: pass.requested_at,
                status: pass.status,
            };
        })
        .filter(p => p !== null);


      // 3. Combine and sort
      const combined = [...lateComers, ...specialPasses]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setRecentPasses(combined);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || 'Failed to fetch dashboard data.');
      setRecentPasses([]);
    } finally {
      setLoading(false);
    }
}, []);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchRequests();

      const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const socket = io(socketUrl);

      socket.on('connect', () => {
        if (user?.id) {
          socket.emit('authenticate', user.id);
        }
      });

      socket.on('statusUpdate:gatePass', (data) => {
        const message = `Your gate pass status has been updated to ${data.newStatus}.`;
        toast.info(message);
        addNotification(message, data.newStatus === 'Approved' ? 'success' : 'alert', `/student/active-pass`);
        fetchRequests();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, fetchRequests, toast, addNotification]);

  return (
    <div className="dashboard-content-box">
      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <Avatar
            src={user?.profilePictureUrl ? resolveProfileImageUrl(user.profilePictureUrl) : undefined}
            alt={user?.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
            imgProps={{ onError: (e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; } }}
            sx={{ width: 80, height: 80, border: `2.5px solid var(--primary-color)`, cursor: 'pointer' }}
            onClick={() => navigate('profile')}
          >
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
          </Avatar>
        </Col>
        <Col>
          <h4 className="fw-bold">Hi, {user?.fullName}</h4>
          <p className="text-muted small mb-0">Student ID: {user?.studentId || user?.id}</p>
          <p className="text-muted small mb-0">Department: {user?.department}</p>
          <p className="text-muted small mb-0">Year: {user?.year}</p>
        </Col>
      </Row>
      <QuickActions />
      <h5>Recent Activity</h5>
      <RequestHistory loading={loading} error={error} requests={recentPasses} navigate={navigate} />
    </div>
  );
};

// --- StudentDashboard Main Component ---

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount, markAllAsRead } = useNotifications();

  const [siderVisible, setSiderVisible] = useState(false);
  const [showNotificationList, setShowNotificationList] = useState(false);

  const handleNotificationClick = () => {
    console.log("Notification bell clicked. showNotificationList:", showNotificationList);
    setShowNotificationList((prev) => !prev);
    if (!showNotificationList && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleMenuClick = (path) => {
    if (path === 'logout') {
      logout('/student-login');
    } else {
      navigate(path);
    }
    setSiderVisible(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100 dashboard-container">

      {/* Header */}
      <header className="d-flex justify-content-between align-items-center px-4 dashboard-header">
        <Button variant="link" onClick={() => setSiderVisible(true)} className="menu-button"><MenuIcon /></Button>
        <h4 className="m-0">Dashboard</h4>
        <div className="d-flex align-items-center gap-3">
          <Form.Check type="switch" id="theme-switch" label={theme === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />} checked={theme === 'dark'} onChange={toggleTheme} />
          <div className="position-relative" style={{ cursor: 'pointer' }} onClick={handleNotificationClick}>
            <NotificationsOutlined className="notification-icon" />
            {unreadCount > 0 && <Badge pill bg="danger" className="notification-badge">{unreadCount}</Badge>}
            {showNotificationList && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, marginTop: '10px' }}>
                <NotificationList onClose={() => {
                  console.log("NotificationList onClose called.");
                  setShowNotificationList(false);
                }} />
              </div>
            )}
          </div>
          <LogoutOutlined className="logout-icon" onClick={() => logout('/student-login')} />
        </div>
      </header>

      {/* Sidebar */}
      <Offcanvas show={siderVisible} onHide={() => setSiderVisible(false)} placement="start" className="dashboard-sidebar">
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : undefined}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            <NavLink to="." end className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <DashboardOutlined className="me-2" /> Dashboard
            </NavLink>
            <NavLink to="late-entry" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <ListAltOutlined className="me-2" /> Late Comer
            </NavLink>
            <NavLink to="special-pass" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <CardMembership className="me-2" /> Special Pass
            </NavLink>
            <NavLink to="library-activation" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <LibraryBooks className="me-2" /> Activate Library ID
            </NavLink>
            <NavLink to="active-pass" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <AddOutlined className="me-2" /> Gate Pass
            </NavLink>
            <NavLink to="profile" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => setSiderVisible(false)}>
              <PersonOutlined className="me-2" /> Profile
            </NavLink>
            <Nav.Link onClick={() => handleMenuClick('logout')}><LogoutOutlined className="me-2" /> Logout</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <main className="flex-grow-1 p-3 dashboard-content-area">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-3 dashboard-footer">
        <p className="m-0 text-muted small">Paperless Campus ©2025</p>
      </footer>

    </div>
  );
}
