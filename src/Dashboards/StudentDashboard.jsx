import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, } from 'react-router-dom';
import {  Row, Col, Card, Button, Spinner, Alert, Offcanvas, Nav, Badge, Form } from 'react-bootstrap';
import Avatar from '@mui/material/Avatar'; // MUI Avatar
import {
  Menu as MenuIcon, // Renamed to avoid conflict with Ant Design Menu
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
  LightModeOutlined, // For light theme icon
  DarkModeOutlined // For dark theme icon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../api/client';
import StudentLateEntry from '../student/StudentLateEntry';
import DeclinedRequestDetails from '../student/DeclinedRequestDetails';
import useToastService from '../hooks/useToastService'; // Import ToastService

// Helper to determine status color
const getStatusStyle = (status) => {
  switch (status) {
    case 'Pending':
      return { color: 'var(--warning-color)', icon: null };
    case 'Approved':
      return { color: 'var(--success-color)', icon: <CheckCircleOutlined style={{ color: 'var(--success-color)' }} /> };
    case 'Declined':
    case 'Rejected':
      return { color: 'var(--error-color)', icon: <CancelOutlined style={{ color: 'var(--error-color)' }} /> };
    default:
      return { color: 'var(--text-primary)', icon: null };
  }
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const currentTheme = {
    card: theme === 'dark' ? 'var(--card-bg)' : '#FFFFFF',
    innerCard: theme === 'dark' ? 'var(--bg-secondary)' : '#F8F8F8',
    txt: theme === 'dark' ? 'var(--text-primary)' : '#333333',
    border: theme === 'dark' ? 'var(--border-color)' : '#E8E8E8',
    accentOrange: 'var(--warning-color)',
    accentGreen: 'var(--success-color)',
    accentRed: 'var(--error-color)',
    primary: 'var(--primary-color)'
  };

  const quick = [
    { icon: <AddOutlined />, label: "New Gate Pass", color: currentTheme.primary, path: "/student/gate-pass" },
    { icon: <StarOutlined />, label: "Special Pass", color: currentTheme.primary, path: "/student/special-request" },
    { icon: <PersonOutlined />, label: "Late Comer", color: currentTheme.primary, path: "/student/late-entry" },
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/latecomers/mine');
        if (response.data && response.data.success) {
          setRequests(response.data.entries);
        } else {
          throw new Error(response.data.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching requests.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'student') {
      fetchRequests();
    }
  }, [user]);

  return (
    <div className="dashboard-content-box">
      <Row style={{ alignItems: "center", marginBottom: 32, gap: 16 }}>
        <Col xs="auto">
          <Avatar src={user?.photo} sx={{ width: 80, height: 80, border: `2.5px solid ${currentTheme.primary}` }} />
        </Col>
        <Col>
          <h4 style={{ display: 'block', fontSize: 24, fontWeight: 800, color: currentTheme.txt }}>
            Hi, {user?.name}
          </h4>
          <p style={{ fontSize: 13, color: '#888' }}>Student ID: {user?.studentId || user?.id}</p>
        </Col>
      </Row>
      <div>
        <h5 style={{ color: currentTheme.txt, marginBottom: 12 }}>Quick Actions</h5>
        <Row style={{ marginBottom: 30 }} xs={1} sm={2} md={3} className="g-3">
          {quick.map((q) => (
            <Col key={q.label}>
              <NavLink to={q.path} style={{ textDecoration: 'none' }}>
                <Card style={{ background: currentTheme.innerCard, borderRadius: 12, textAlign: 'center', minHeight: 125, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, border: `1px solid ${currentTheme.border}` }}>
                  <Card.Body>
                    <div style={{ color: q.color, fontSize: 26 }}>{q.icon}</div>
                    <p style={{ fontWeight: 600, color: currentTheme.txt }}>{q.label}</p>
                  </Card.Body>
                </Card>
              </NavLink>
            </Col>
          ))}
        </Row>
      </div>
      <div>
        <h5 style={{ color: currentTheme.txt }}>Request History</h5>
        {loading ? (
          <Spinner animation="border" size="lg" style={{ display: 'block', marginTop: 20 }} />
        ) : error ? (
          <Alert variant="danger" className="mt-3">Error: {error}</Alert>
        ) : requests.length === 0 ? (
          <Card style={{ background: currentTheme.innerCard, borderRadius: 10, textAlign: 'center', padding: '2rem 0', border: `1px solid ${currentTheme.border}` }}>
            <Card.Body>
              <p style={{ color: currentTheme.txt }}>No request history found. Submit a new request to get started.</p>
            </Card.Body>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
            {requests.map((r) => {
              const { color, icon: statusIcon } = getStatusStyle(r.status);
              return (
                <Card key={r._id} style={{ background: currentTheme.innerCard, borderRadius: 10, border: `1px solid ${currentTheme.border}` }}>
                  <Card.Body>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 1, minWidth: 0 }}>
                        <div style={{ color: currentTheme.primary, fontSize: 21 }}><DescriptionOutlined /></div>
                        <div style={{ flexShrink: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: currentTheme.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginBottom: 0 }}>
                            {r.reason || 'Late Entry'}
                          </p>
                          <p style={{ color, fontSize: 14, marginBottom: 0 }}>{r.status}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {statusIcon}
                        {(r.status === 'Declined' || r.status === 'Rejected') && (
                          <Button 
                            variant="primary" 
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
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const [siderVisible, setSiderVisible] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToastService(); // Use ToastService

  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    const fetchRejectedRequests = async () => {
      try {
        const response = await api.get('/api/latecomers/rejected-for-student');
        if (response.data && response.data.success) {
          setRejectedRequests(response.data.entries);
          setRejectedCount(response.data.entries.length);
        }
      } catch (err) {
        console.error('Error fetching rejected requests:', err);
      }
    };

    if (user && user.role === 'student') {
      fetchRejectedRequests();
    }
  }, [user]);

  const handleNotificationClick = () => {
    if (rejectedRequests.length > 0) {
      navigate(`/student/request/edit/${rejectedRequests[0]._id}`);
    } else {
      toast.info('No rejected requests to review.'); // Use toast.info
    }
  };

  const handleMenuClick = (path) => { // Changed to accept path directly
    if (path === 'logout') {
      logout('/student-login');
    } else {
      navigate(path);
    }
    setSiderVisible(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 1000 }}>
        <Button variant="link" onClick={() => setSiderVisible(true)} style={{ color: 'var(--text-primary)', fontSize: '24px' }}>
          <MenuIcon />
        </Button>
        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
          Dashboard
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Form.Check
            type="switch"
            id="theme-switch"
            label={theme === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />}
            checked={theme === 'dark'}
            onChange={toggleTheme}
            style={{ display: 'flex', alignItems: 'center' }}
          />
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleNotificationClick}>
            <NotificationsOutlined style={{ fontSize: 24, color: 'var(--text-primary)' }} />
            {rejectedCount > 0 && (
              <Badge pill bg="danger" style={{ position: 'absolute', top: -5, right: -5 }}>
                {rejectedCount}
              </Badge>
            )}
          </div>
          <LogoutOutlined style={{ fontSize: 24, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => logout('/student-login')} />
        </div>
      </header>

      {/* Offcanvas (Drawer replacement) */}
      <Offcanvas show={siderVisible} onHide={() => setSiderVisible(false)} placement="start" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : 'dark'}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            <NavLink to="/student" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => handleMenuClick('/student')}>
              <DashboardOutlined className="me-2" /> Dashboard
            </NavLink>
            <NavLink to="/student/late-entry" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => handleMenuClick('/student/late-entry')}>
              <ListAltOutlined className="me-2" /> Late Comer
            </NavLink>
            <NavLink to="/student/profile" className={({ isActive }) => "nav-link" + (isActive ? " active-link" : "")} onClick={() => handleMenuClick('/student/profile')}>
              <PersonOutlined className="me-2" /> Profile
            </NavLink>
            <Nav.Link onClick={() => handleMenuClick('logout')}>
              <LogoutOutlined className="me-2" /> Logout
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Content */}
      <main className="flex-grow-1 p-3 dashboard-content-area">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/late-entry" element={<StudentLateEntry />} />
          <Route path="/request/edit/:requestId" element={<DeclinedRequestDetails />} />
          <Route path="/submit-entry/:requestId" element={<StudentLateEntry />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', textAlign: 'center', padding: '1rem 0' }}>
        <p style={{color: 'var(--text-secondary)', margin: 0}}>Paperless Campus ©2023</p>
      </footer>
    </div>
  );
}
