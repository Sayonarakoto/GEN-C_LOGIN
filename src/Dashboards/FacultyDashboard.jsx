import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Offcanvas, Nav, Badge, Form, Tab, Tabs } from "react-bootstrap";
import {
  Menu as MenuIcon,
  NotificationsOutlined,
  LogoutOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  DescriptionOutlined, // For FileDoneOutlined
  AccessTime, // For ClockCircleOutlined
  UploadFile, // For UploadOutlined
  ErrorOutline, // For ExclamationCircleOutlined
  CheckCircleOutline // For CheckCircleOutlined (if needed)
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../api/client';
import FacultyLateEntries from "../faculty/FacultyLateEntries";
import LateEntriesApprovals from "../faculty/LateEntriesApprovals";
import ExcelUpload from "../faculty/ExcelUpload";
import StudentTable from "../faculty/StudentTable";
import useToastService from '../hooks/useToastService'; // Import ToastService
import "./Dashboard.css";

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("approvals");
  const [allStudents, setAllStudents] = useState([]);
  const [stats, setStats] = useState({ pending: 0, lateToday: 0, approved: 0, alerts: 0 });
  const [siderVisible, setSiderVisible] = useState(false);

  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToastService(); // Use ToastService

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/faculty/stats');
        if (response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await api.get(`/api/students`);
      setAllStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student data.'); // Use toast.error
    }
  }, [toast]);

  useEffect(() => {
    if (selectedKey === 'manageStudents') {
      fetchAllStudents();
    }
  }, [selectedKey, fetchAllStudents]);

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      logout();
      toast.success("You have been logged out."); // Use toast.success
      navigate('/');
    } else {
      setSelectedKey(key);
    }
    setSiderVisible(false);
  };

  const handleUploadSuccess = () => {
    toast.success("Student data uploaded successfully!"); // Use toast.success
    fetchAllStudents();
  };

  const menuItems = [
    { key: 'approvals', icon: <DescriptionOutlined />, label: 'Approvals' },
    { key: 'lateEntries', icon: <AccessTime />, label: 'All Late Entries' },
    { key: 'uploadStudents', icon: <UploadFile />, label: 'Student Management' },
    { key: 'manageStudents', icon: <DescriptionOutlined />, label: 'Manage Students' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' },
  ];

  const tabItems = [
    {
      eventKey: 'approvals',
      title: 'Approvals',
      children: <LateEntriesApprovals />,
    },
    {
      eventKey: 'lateEntries',
      title: 'All Late Entries',
      children: <FacultyLateEntries />,
    },
    {
      eventKey: 'uploadStudents',
      title: 'Student Management',
      children: <ExcelUpload onUploadSuccess={handleUploadSuccess} />
    },
    {
      eventKey: 'manageStudents',
      title: 'Manage Students',
      children: <StudentTable students={allStudents} />
    },
  ];

  const SidebarMenu = () => (
    <Nav className="flex-column">
      {menuItems.map(item => (
        <Nav.Link
          key={item.key}
          active={selectedKey === item.key}
          onClick={() => handleMenuClick(item.key)}
          className="d-flex align-items-center"
        >
          {item.icon} <span className="ms-2">{item.label}</span>
        </Nav.Link>
      ))}
    </Nav>
  );

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        width: '100%',
        zIndex: 1000,
        background: 'var(--header-bg)',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Button variant="link" onClick={() => setSiderVisible(true)} style={{ color: 'var(--text-primary)', fontSize: '24px' }}>
          <MenuIcon />
        </Button>
        <h4 style={{ color: 'var(--text-primary)', margin: 0, textAlign: 'center' }}>Faculty Dashboard</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Form.Check
            type="switch"
            id="theme-switch"
            label={theme === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />}
            checked={theme === 'dark'}
            onChange={toggleTheme}
            style={{ display: 'flex', alignItems: 'center' }}
          />
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <NotificationsOutlined style={{ fontSize: 24, color: 'var(--text-primary)' }} />
            {stats.alerts > 0 && (
              <Badge pill bg="danger" style={{ position: 'absolute', top: -5, right: -5 }}>
                {stats.alerts}
              </Badge>
            )}
          </div>
          <Button variant="link" onClick={() => handleMenuClick('logout')} style={{ color: 'var(--text-primary)', fontSize: '24px' }}>
            <LogoutOutlined />
          </Button>
        </div>
      </header>

      <Offcanvas
        show={siderVisible}
        onHide={() => setSiderVisible(false)}
        placement="start"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : 'dark'}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarMenu />
        </Offcanvas.Body>
      </Offcanvas>

      <main className="flex-grow-1" style={{ marginTop: 64, background: 'var(--bg-primary)', padding: '24px' }}>
        <Container fluid>
          <Row className="g-4 mb-4">
            <Col xs={12} sm={6} md={4} lg={3}>
              <Card className="dashboard-content-box">
                <Card.Body>
                  <h3 style={{ color: 'var(--warning-color)', fontSize: '1.5rem' }}>{stats.pending}</h3>
                  <p className="text-muted">Pending Requests</p>
                  <ErrorOutline style={{ fontSize: 24, color: 'var(--warning-color)' }} />
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3}>
              <Card className="dashboard-content-box">
                <Card.Body>
                  <h3 style={{ fontSize: '1.5rem' }}>{stats.lateToday}</h3>
                  <p className="text-muted">Late Entries Today</p>
                  <AccessTime style={{ fontSize: 24 }} />
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3}>
              <Card className="dashboard-content-box">
                <Card.Body>
                  <h3 style={{ color: 'var(--success-color)', fontSize: '1.5rem' }}>{stats.approved}</h3>
                  <p className="text-muted">Approved Late Entries</p>
                  <CheckCircleOutline style={{ fontSize: 24, color: 'var(--success-color)' }} />
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={4} lg={3}>
              <Card className="dashboard-content-box">
                <Card.Body>
                  <h3 style={{ color: 'var(--error-color)', fontSize: '1.5rem' }}>{stats.alerts}</h3>
                  <p className="text-muted">Security Alerts</p>
                  <ErrorOutline style={{ fontSize: 24, color: 'var(--error-color)' }} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Card className="dashboard-content-box">
            <Card.Body>
              <Tabs activeKey={selectedKey} onSelect={handleMenuClick} className="mb-3">
                {tabItems.map((tab) => (
                  <Tab eventKey={tab.eventKey} title={tab.title} key={tab.eventKey}>
                    {tab.children}
                  </Tab>
                ))}
              </Tabs>
            </Card.Body>
          </Card>
        </Container>
      </main>
    </div>
  );
}

export default FacultyDashboard;
