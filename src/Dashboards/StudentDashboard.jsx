// StudentDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
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
  DarkModeOutlined
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import useToastService from '../hooks/useToastService';
import api from '../api/client';

import StudentLateEntry from '../student/StudentLateEntry';
import DeclinedRequestDetails from '../student/DeclinedRequestDetails';
import './Dashboard.css'; // Make sure to import the CSS file

// ---------------- Helper Functions ---------------- //
const getStatusStyle = (status) => {
  switch (status) {
    case 'Pending':
      return { color: 'var(--warning-color)', icon: null };
    case 'Approved':
      return {
        color: 'var(--success-color)',
        icon: <CheckCircleOutlined style={{ color: 'var(--success-color)' }} />
      };
    case 'Declined':
    case 'Rejected':
      return {
        color: 'var(--error-color)',
        icon: <CancelOutlined style={{ color: 'var(--error-color)' }} />
      };
    default:
      return { color: 'var(--text-primary)', icon: null };
  }
};

// ---------------- Reusable Components ---------------- //
const QuickActions = () => {
  const actions = [
    { icon: <AddOutlined />, label: "New Gate Pass", path: "/student/gate-pass" },
    { icon: <StarOutlined />, label: "Special Pass", path: "/student/special-request" },
    { icon: <PersonOutlined />, label: "Late Comer", path: "/student/late-entry" }
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

const RequestHistory = ({ loading, error, requests, navigate }) => {
  if (loading) return <Spinner animation="border" size="lg" className="mt-3 d-block mx-auto" />;
  if (error) return <Alert variant="danger" className="mt-3">Error: {error}</Alert>;

  if (requests.length === 0) {
    return (
      <Card className="text-center p-4 request-history-card">
        <p>No request history found. Submit a new request to get started.</p>
      </Card>
    );
  }

  return (
    <div className="d-flex flex-column gap-3 mt-3">
      {requests.map((r) => {
        const { color, icon } = getStatusStyle(r.status);
        return (
          <Card key={r._id} className="request-history-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden">
                <DescriptionOutlined className="request-history-icon" />
                <div className="text-truncate">
                  <p className="mb-0 fw-bold text-truncate">
                    {r.reason || 'Late Entry'}
                  </p>
                  <p className="mb-0" style={{ color, fontSize: 14 }}>{r.status}</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {icon}
                {(r.status === 'Declined' || r.status === 'Rejected') && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/request/edit/${r._id}`);
                    }}
                  >
                    Edit/Resubmit
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

// ---------------- Dashboard Home ---------------- //
const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/api/latecomers/mine');
      if (data?.success) {
        setRequests(data.entries);
      } else {
        throw new Error(data?.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'student') fetchRequests();
  }, [user, fetchRequests]);

  return (
    <div className="dashboard-content-box">
      {/* Profile Header */}
      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <Avatar
            src={user?.photo}
            sx={{ width: 80, height: 80, border: `2.5px solid var(--primary-color)` }}
          />
        </Col>
        <Col>
          <h4 className="fw-bold">
            Hi, {user?.name}
          </h4>
          <p className="text-muted small mb-0">Student ID: {user?.studentId || user?.id}</p>
          <p className="text-muted small mb-0">Department: {user?.department}</p>
          <p className="text-muted small mb-0">Year: {user?.year}</p>
        </Col>
      </Row>

      <QuickActions />
      <h5>Request History</h5>
      <RequestHistory
        loading={loading}
        error={error}
        requests={requests}
        navigate={navigate}
      />
    </div>
  );
};

// ---------------- Main Student Dashboard ---------------- //
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToastService();

  const [siderVisible, setSiderVisible] = useState(false);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0);

  const fetchRejected = useCallback(async () => {
    try {
      const { data } = await api.get('/api/latecomers/rejected-for-student');
      if (data?.success) {
        setRejectedRequests(data.entries);
        setRejectedCount(data.entries.length);
      }
    } catch (err) {
      console.error('Error fetching rejected requests:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'student') fetchRejected();
  }, [user, fetchRejected]);

  const handleNotificationClick = () => {
    if (rejectedRequests.length > 0) {
      navigate(`/student/request/edit/${rejectedRequests[0]._id}`);
    } else {
      toast.info('No rejected requests to review.');
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
        <Button variant="link" onClick={() => setSiderVisible(true)} className="menu-button">
          <MenuIcon />
        </Button>
        <h4 className="m-0">Dashboard</h4>
        <div className="d-flex align-items-center gap-3">
          <Form.Check
            type="switch"
            id="theme-switch"
            label={theme === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />}
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <div className="position-relative" style={{ cursor: 'pointer' }} onClick={handleNotificationClick}>
            <NotificationsOutlined className="notification-icon" />
            {rejectedCount > 0 && (
              <Badge pill bg="danger" className="notification-badge">
                {rejectedCount}
              </Badge>
            )}
          </div>
          <LogoutOutlined
            className="logout-icon"
            onClick={() => logout('/student-login')}
          />
        </div>
      </header>

      {/* Sidebar */}
      <Offcanvas
        show={siderVisible}
        onHide={() => setSiderVisible(false)}
        placement="start"
        className="dashboard-sidebar"
      >
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : 'dark'}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            <NavLink to="/student" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")}
              onClick={() => handleMenuClick('/student')}>
              <DashboardOutlined className="me-2" /> Dashboard
            </NavLink>
            <NavLink to="/student/late-entry" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")}
              onClick={() => handleMenuClick('/student/late-entry')}>
              <ListAltOutlined className="me-2" /> Late Comer
            </NavLink>
            <NavLink to="/student/profile" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")}
              onClick={() => handleMenuClick('/student/profile')}>
              <PersonOutlined className="me-2" /> Profile
            </NavLink>
            <Nav.Link onClick={() => handleMenuClick('logout')}>
              <LogoutOutlined className="me-2" /> Logout
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <main className="flex-grow-1 p-3 dashboard-content-area">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/late-entry" element={<StudentLateEntry />} />
          <Route path="/request/edit/:requestId" element={<DeclinedRequestDetails />} />
          <Route path="/submit-entry/:requestId" element={<StudentLateEntry />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 dashboard-footer">
        <p className="m-0 text-muted small">Paperless Campus ©2023</p>
      </footer>
    </div>
  );
}