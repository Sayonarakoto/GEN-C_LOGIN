import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Nav, Offcanvas } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'boxicons/css/boxicons.min.css'; // Import boxicons CSS
import { io } from 'socket.io-client';
import {
  Box,
  Typography,
  Avatar,
  Card, // Using MUI Card for consistency
  Button as MUIButton, // Renamed to avoid conflict with react-bootstrap Button
  Grid,
} from "@mui/material";
import { styled } from '@mui/material/styles';

import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../api/client';
import FacultyLateEntries from "../faculty/FacultyLateEntries";
import LateEntriesApprovals from "../faculty/LateEntriesApprovals";
import ExcelUpload from "../faculty/ExcelUpload";
import StudentTable from "../faculty/StudentTable";
import FacultySpecialPasses from "../faculty/FacultySpecialPasses"; // Import FacultySpecialPasses
import AuditTrail from "../faculty/AuditTrail"; // Import AuditTrail
import useToastService from '../hooks/useToastService';
import FacultyGatePass from "../faculty/FacultyGatePass";
import FacultyProfile from "../faculty/FacultyProfile"; // Import FacultyProfile

const FacultyDashboard = () => {
  const [selectedKey, setSelectedKey] = useState("approvals");
  const [allStudents, setAllStudents] = useState([]);
  const [stats, setStats] = useState({ pending: 0, lateToday: 0, approved: 0, alerts: 0 });
  const [showOffcanvas, setShowOffcanvas] = useState(false); // State for Offcanvas visibility

  const { user, loading, logout } = useAuth();
  const { theme } = useTheme(); // theme will be 'light' or 'dark'
  const navigate = useNavigate();
  const toast = useToastService();

  const refreshStats = useCallback(async () => {
      try {
        const response = await api.get('/api/faculty/stats');
        if (response.data && response.data.success) {
          setStats(prevStats => ({
            ...prevStats,
            pending: response.data.data.pending,
            approved: response.data.data.approved,
            lateToday: response.data.data.todayEntry,
            alerts: response.data.data.alerts,
          }));
        }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error('Failed to refresh dashboard stats.');
    }
  }, [toast]);

  useEffect(() => {
    if (loading || !user) return; // CRITICAL CHECK
    refreshStats();
  }, [refreshStats, loading, user]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await api.get(`/api/students`);
      setAllStudents(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error('Failed to load student data.');
    }
  }, [toast]);

  useEffect(() => {
    if (loading || !user) return; // CRITICAL CHECK
    if (selectedKey === 'manageStudents') {
      fetchAllStudents();
    }
  }, [selectedKey, fetchAllStudents, loading, user]);

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      logout();
      toast.success("You have been logged out.");
      navigate('/');
    } else {
      setSelectedKey(key);
    }
    setShowOffcanvas(false); // Close offcanvas on menu item click
  };

  const handleUploadSuccess = () => {
    toast.success("Student data uploaded successfully!");
    fetchAllStudents();
  };

  // Helper component for Sidebar Links
  const SidebarLink = ({ icon, text, active, onClick }) => {
    const secondaryAccent = "#3b82f6"; // From template
    const color = active ? secondaryAccent : "#6b7280";
    const fontWeight = active ? 600 : 500;
    const iconClass = icon.startsWith('bxs-') ? `bx ${icon}` : `bx bx-${icon}`;
    return (
      <Box
        onClick={onClick}
        sx={{
          display: "flex", alignItems: "center",
          px: 3, py: 1.5,
          bgcolor: active ? "#e0f2fe" : "inherit", // Light blue background for active
          color: color,
          fontWeight: fontWeight,
          borderRadius: 2,
          mb: 1,
          transition: "0.2s",
          cursor: "pointer",
          '&:hover': {
            bgcolor: active ? "#e0f2fe" : "#f3f4f6", // Light gray on hover
          }
        }}
      >
        <i className={iconClass} style={{ fontSize: 24, marginRight: 14, color }} />
        <Typography sx={{ color, fontWeight }}>{text}</Typography>
      </Box>
    );
  };

  // Helper component for Dashboard Stat Card
  const DashboardStatCard = ({ title, value, color }) => {
    return (
      <Card sx={{ borderRadius: 3, p: 5, bgcolor: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
        <Typography fontSize={14} color="#64748b" gutterBottom fontWeight={500}>{title}</Typography>
        <Typography fontSize={32} fontWeight={700} sx={{ mt: 1, color }}>{value}</Typography>
      </Card>
    );
  };

  const baseMenuItems = [
    { key: 'approvals', icon: 'check-circle', label: 'Approvals' },
    { key: 'lateEntries', icon: 'time', label: 'All Late Entries' },
    { key: 'uploadStudents', icon: 'upload', label: 'Upload Students' },
    { key: 'manageStudents', icon: 'group', label: 'Manage Students' },
    { key: 'specialPasses', icon: 'bxs-purchase-tag', label: 'Special Passes' },
    { key: 'gatePass', icon: 'exit', label: 'Gate Pass' },
    { key: 'auditLogs', icon: 'list-ul', label: 'Audit Logs' },
    { key: 'profile', icon: 'user', label: 'Profile' }, // New menu item
  ];

  const menuItems = baseMenuItems;

  const renderContent = () => {
    switch (selectedKey) {
      case 'approvals':
        return <LateEntriesApprovals onActionComplete={refreshStats} />;
      case 'lateEntries':
        return <FacultyLateEntries />;
      case 'uploadStudents':
        return <ExcelUpload onUploadSuccess={handleUploadSuccess} />;
      case 'manageStudents':
        return <StudentTable students={allStudents} />;
      case 'specialPasses':
        if (user?.role === 'HOD') {
          return <FacultySpecialPasses />;
        } else {
          return <p>You are not authorized to view Special Passes.</p>;
        }
      case 'auditLogs':
        return <AuditTrail />;
      case 'gatePass':
        return <FacultyGatePass />;
      case 'profile': // New case for profile
        return <FacultyProfile />;
      default:
        return <p>Select an option from the menu.</p>;
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f3f4f6", fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Sidebar (desktop) */}
      <Box sx={{ display: { xs: "none", md: "flex" }, height: "100vh", flexDirection: "column", bgcolor: "#fff", borderRight: "1px solid #e5e7eb", width: 256 }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center" }}>
          <Typography variant="h5" color="primary" fontWeight={700}>C</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", ml: 1 }}>GEN</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Box component="nav" sx={{ mt: 3 }}>
            {menuItems.map((item) => (
              <SidebarLink
                key={item.key}
                icon={item.icon}
                text={item.label}
                active={selectedKey === item.key}
                onClick={() => handleMenuClick(item.key)}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ p: 2, borderTop: "1px solid #e5e7eb" }}>
          <SidebarLink icon="log-out" text="Logout" onClick={() => handleMenuClick('logout')} />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Apply the gradient
            color: 'white', // Ensure text is visible on the dark background
            borderBottom: "1px solid #e5e7eb", // Keep existing border
            display: "flex", justifyContent: "space-between", alignItems: "center",
            px: 4, py: { xs: 1.5, md: 2 }
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MUIButton variant="text" onClick={() => setShowOffcanvas(true)} sx={{ display: { md: "none" }, minWidth: 0 }}>
              <i className='bx bx-menu' style={{ fontSize: 26, color: "white" }}></i>
            </MUIButton>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "white", ml: { xs: 0, md: 2 }, fontSize: { xs: 18, md: 24 } }}
            >
              {user?.role === 'HOD' ? 'HOD Dashboard' : 'Faculty Dashboard'}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <i className='bx bx-bell' style={{ fontSize: 24, color: "white" }}></i>
            <Avatar
              src={user?.profilePictureUrl ? `http://localhost:3001${user.profilePictureUrl}` : undefined}
              alt={user?.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
              sx={{ width: 32, height: 32, cursor: 'pointer' }}
              onClick={() => handleMenuClick('profile')}
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <Typography variant="subtitle1" sx={{ color: "white", fontWeight: 600 }}>
                Hi, {user?.fullName}
              </Typography>
              <Typography variant="body2" sx={{ color: "white" }}>
                Department: {user?.department}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content layout */}
        <Container fluid sx={{ background: "#f3f4f6", flex: 1, p: { xs: 2, md: 6 } }}>
          {/* Top summary cards */}
          <Row className="mb-4">
            <Col md={3} xs={12} className="mb-3">
              <DashboardStatCard title="Pending Requests" value={stats.pending} color="#f59e42" />
            </Col>
            <Col md={3} xs={12} className="mb-3">
              <DashboardStatCard title="Late Entries Today" value={stats.lateToday} color="#22c55e" />
            </Col>
            <Col md={3} xs={12} className="mb-3">
              <DashboardStatCard title="Approved Late Entries" value={stats.approved} color="#3b82f6" />
            </Col>
            <Col md={3} xs={12} className="mb-3">
              <DashboardStatCard title="Alerts" value={stats.alerts} color="#ef4444" />
            </Col>
          </Row>

          {/* Dynamic Content based on selectedKey */}
          <Card sx={{ borderRadius: 3, p: { xs: 3, md: 6 }, bgcolor: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
            {renderContent()}
          </Card>
        </Container>

        {/* Mobile Footer Navbar */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "1px solid #e5e7eb",
            justifyContent: "space-around",
            py: 1.5
          }}
        >
          <FooterNavItem icon="dashboard" text="Dashboard" active={selectedKey === 'approvals'} onClick={() => handleMenuClick('approvals')} />
          <FooterNavItem icon="check-circle" text="Approvals" active={selectedKey === 'approvals'} onClick={() => handleMenuClick('approvals')} />
          <FooterNavItem icon="group" text="Students" active={selectedKey === 'manageStudents'} onClick={() => handleMenuClick('manageStudents')} />
          <FooterNavItem icon="ticket" text="Passes" active={selectedKey === 'specialPasses'} onClick={() => handleMenuClick('specialPasses')} />
          <FooterNavItem icon="list-ul" text="Audit" active={selectedKey === 'auditLogs'} onClick={() => handleMenuClick('auditLogs')} />
          <FooterNavItem icon="user" text="Profile" active={selectedKey === 'profile'} onClick={() => handleMenuClick('profile')} /> {/* New footer item */}
          <FooterNavItem icon="log-out" text="Logout" onClick={() => handleMenuClick('logout')} />
        </Box>
      </Box>

      {/* Offcanvas (Sidebar) */}
      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="start"
        sx={{ bgcolor: "#fff", width: 256, borderRight: "1px solid #e5e7eb" }}>
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : undefined}>
          <Offcanvas.Title className="fw-bold fs-4">
            <span className="text-primary">G</span>EN-C Login
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 d-flex flex-column">
          <Nav className="flex-column flex-grow-1">
            {menuItems.map((item) => (
              <SidebarLink
                key={item.key}
                icon={item.icon}
                text={item.label}
                active={selectedKey === item.key}
                onClick={() => handleMenuClick(item.key)}
              />
            ))}
          </Nav>
          <Box sx={{ mt: "auto", borderTop: "1px solid #e5e7eb", pt: 3 }}>
            <SidebarLink icon="log-out" text="Logout" onClick={() => handleMenuClick('logout')} />
          </Box>
        </Offcanvas.Body>
      </Offcanvas>
    </Box>
  );
};

// Helper component for Footer Nav Items (Mobile)
const FooterNavItem = ({ icon, text, active, onClick }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5,
        color: active ? "#3b82f6" : "#6b7280",
        cursor: "pointer",
        '&:hover': {
          color: "#3b82f6",
        }
      }}
    >
      <i className={`bx bx-${icon}`} style={{ fontSize: 24, fontVariationSettings: active ? "'FILL' 1" : undefined }} />
      <Typography sx={{ fontSize: 13, fontWeight: 400 }}>{text}</Typography>
    </Box>
  );
};

export default FacultyDashboard;