import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import useToastService from '../hooks/useToastService'; // For notifications
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { useAuth } from "../hooks/useAuth"; // Import useAuth
import { mockStudents } from '../mockData'; // Import mockStudents

const SecurityDashboard = () => {
  const [scanId, setScanId] = useState('');
  const toast = useToastService(); // Initialize toast service
  const [verificationData, setVerificationData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const scanInputRef = useRef(null);
  const navigate = useNavigate(); // Initialize navigate
  const { logout } = useAuth(); // Use logout from AuthContext

  // Placeholder logout function (replace with actual useAuth().logout if applicable)
  const handleLogout = () => {
    logout(); // Call the actual logout function
    console.log("Security user logged out.");
    // In a real app, you would clear tokens, user data, etc.
    navigate('/'); // Redirect to home page
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus on scan input
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  

  const handleScan = () => {
    const studentId = scanId.trim();
    if (!studentId) {
      toast.warning('Please enter a Campus ID or scan a QR code.');
      return;
    }

    const student = mockStudents[studentId];
    console.log('Student found:', student); // Debugging log

    if (student) {
      setVerificationData(student);
      console.log('Verification Data set to:', student); // Debugging log
      if (student.status === 'expired') {
        addAlert({ type: 'warning', message: `Expired Pass Attempt: ${student.name} (${student.id})` });
      } else {
        // Simulate valid entry
      }
    } else {
      setVerificationData(null);
      addAlert({ type: 'error', message: `Invalid Pass Attempt: ID ${studentId}` });
    }
    setScanId(''); // Clear input after scan
    scanInputRef.current.focus(); // Re-focus for next scan
  };

  const addAlert = (newAlert) => {
    setAlerts((prev) => [...prev, { ...newAlert, timestamp: dayjs() }]);
          toast[newAlert.type](newAlert.message); // Use toast service
    // Optional: Play sound cue here
  };

  const handleApproveDeny = (action) => {
    if (!verificationData) return;

    const logEntry = {
      id: Date.now(), // Generate a unique ID
      timestamp: dayjs().format('HH:mm:ss'),
      studentName: verificationData.name,
      passType: verificationData.passType,
      status: verificationData.status === 'valid' ? '✅ Valid' : '❌ Expired',
      actionTaken: action === 'approve' ? 'Entry Allowed' : 'Entry Denied',
    };
    setLogs((prev) => [logEntry, ...prev]);
    setVerificationData(null); // Clear verification card
    scanInputRef.current.focus(); // Re-focus for next scan
  };

  const logColumns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    { title: 'Student Name', dataIndex: 'studentName', key: 'studentName' },
    { title: 'Pass Type', dataIndex: 'passType', key: 'passType' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Action Taken', dataIndex: 'actionTaken', key: 'actionTaken' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{
        background: 'var(--header-bg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Security Dashboard</h3>
        <div className="d-flex align-items-center gap-3">
          <i className="bx bx-time" style={{ fontSize: 24, color: 'var(--text-primary)' }}></i>
          <span style={{ color: 'var(--text-primary)', fontSize: '1.2em' }}>{currentTime.format('HH:mm:ss')}</span>
          <Badge bg="secondary" className="position-relative">
            <i className="bx bx-bell" style={{ fontSize: 24, color: 'var(--text-primary)' }}></i>
            {alerts.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {alerts.length}
                <span className="visually-hidden">unread messages</span>
              </span>
            )}
          </Badge>
          <Button variant="text" onClick={handleLogout}>
            <i className="bx bx-log-out" style={{ fontSize: 24, color: 'var(--text-primary)' }}></i>
          </Button>
        </div>
      </div>

      <Container style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Alert Panel (Top Banner) */}
        {alerts.length > 0 && (
          <Alert
            variant={alerts[alerts.length - 1].type === 'warning' ? 'warning' : 'danger'} // Map Antd type to Bootstrap variant
            onClose={() => setAlerts([])}
            dismissible
            style={{ fontSize: '1.2em' }}
          >
            <h4 className="alert-heading" style={{ margin: 0 }}>Alerts</h4>
            {
              alerts.map((alert, index) => (
                <p key={index} className="mb-0" style={{ display: 'block', fontSize: '1.2em', color: 'var(--text-primary)' }}>
                  {alert.timestamp.format('HH:mm:ss')} - {alert.message}
                </p>
              ))
            }
          </Alert>
        )}

        {/* Scan Panel */}
        <Card style={{ background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <Card.Body>
            <h4 style={{ color: 'var(--text-primary)' }}>Scan Panel</h4>
            <div className="d-flex flex-column gap-3">
              <Form.Control
                ref={scanInputRef}
                placeholder="SCAN OR ENTER ID"
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }} // Use onKeyDown for Enter key
                style={{ height: '50px', fontSize: '1.2em', width: '100%' }}
              />
              <Button variant="primary" onClick={handleScan} style={{ height: '50px', fontSize: '1.2em', width: '100%' }}>
                <i className="bx bx-qr-scan me-2"></i> Scan Now
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Verification Card */}
        {verificationData && (
          <Card style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            borderWidth: '2px',
            borderStyle: verificationData.status === 'valid' ? 'solid' : 'dashed', // Additional visual cue
            borderColor: verificationData.status === 'valid' ? '#4caf50' : '#f44336' // Add border color
          }}>
            <Card.Body>
              <Row className="align-items-center g-3">
                <Col xs="auto">
                  <img src={verificationData.photo} alt="Student" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                </Col>
                <Col>
                  <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>{verificationData.name}</h2>
                  <p style={{ fontSize: '1.2em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pass Type: {verificationData.passType}</p>
                  <p style={{ fontSize: '1.2em', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Valid Until: {verificationData.validUntil.format('h:mm A, MMM D')}</p>
                  <h3 style={{ color: verificationData.status === 'valid' ? '#4caf50' : '#f44336', margin: '10px 0 0 0' }}>
                    {verificationData.status === 'valid' ? '✅ VALID' : '❌ EXPIRED'}
                  </h3>
                </Col>
              </Row>
              <Row className="g-3 mt-3">
                <Col xs={12} md={6}>
                  <Button variant="success" size="lg" style={{ width: '100%', height: '60px', fontSize: '1.5em' }} onClick={() => handleApproveDeny('approve')}>
                    <i className="bx bx-check-circle me-2"></i> ALLOW ENTRY
                  </Button>
                </Col>
                <Col xs={12} md={6}>
                  <Button variant="danger" size="lg" style={{ width: '100%', height: '60px', fontSize: '1.5em' }} onClick={() => handleApproveDeny('deny')}>
                    <i className="bx bx-x-circle me-2"></i> DENY
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Live Logs Table */}
        <Card style={{ background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <Card.Body>
            <h4 style={{ color: 'var(--text-primary)' }}>Live Logs</h4>
            <Table striped bordered hover responsive className="dark-theme-table" style={{ fontSize: '1.2em' }}>
              <thead>
                <tr>
                  {logColumns.map((col) => (
                    <th key={col.key}>{col.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id} className={index % 2 === 0 ? 'log-row-even' : 'log-row-odd'}>
                    {logColumns.map((col) => (
                      <td key={col.key}>{log[col.dataIndex]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default SecurityDashboard;