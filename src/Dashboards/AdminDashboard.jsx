import React, { useState } from "react";
import { Container, Nav, Offcanvas } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Box,
  Typography,
  Avatar,
  Card,
  Button as MUIButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import useToastService from '../hooks/useToastService';
import AdminSettings from "../admin/AdminSettings";
import { resolveProfileImageUrl } from '../utils/resolveProfileImageUrl';

const AdminDashboard = () => {
  const [selectedKey, setSelectedKey] = useState("settings");
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToastService();

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      logout();
      toast.success("You have been logged out.");
      navigate('/');
    } else {
      setSelectedKey(key);
    }
    setShowOffcanvas(false);
  };

  const menuItems = [
    { key: 'settings', icon: 'cog', label: 'Settings' },
  ];

  const SidebarLink = ({ icon, text, active, onClick }) => {
    const secondaryAccent = "#3b82f6";
    const color = active ? secondaryAccent : "#6b7280";
    const iconClass = icon.startsWith('bxs-') ? `bx ${icon}` : `bx bx-${icon}`;
    return (
      <Box
        onClick={onClick}
        sx={{
          display: "flex", alignItems: "center",
          px: 3, py: 1.5,
          bgcolor: active ? "#e0f2fe" : "inherit",
          color,
          fontWeight: active ? 600 : 500,
          borderRadius: 2,
          mb: 1,
          transition: "0.2s",
          cursor: "pointer",
          '&:hover': {
            bgcolor: active ? "#e0f2fe" : "#f3f4f6",
          }
        }}
      >
        <i className={iconClass} style={{ fontSize: 24, marginRight: 14, color }} />
        <Typography sx={{ color, fontWeight: active ? 600 : 500 }}>{text}</Typography>
      </Box>
    );
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'settings': return <AdminSettings />;
      default: return <p>Select an option from the menu.</p>;
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f3f4f6", fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Sidebar (desktop) */}
      <Box sx={{
        display: { xs: "none", md: "flex" }, height: "100vh",
        flexDirection: "column", bgcolor: "#fff", borderRight: "1px solid #e5e7eb", width: 256
      }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center" }}>
          <Typography variant="h5" color="primary" fontWeight={700}>C</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", ml: 1 }}>GEN</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Box component="nav" sx={{ mt: 3 }}>
            {menuItems.map(item => (
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
        <Box sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white', borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          px: 4, py: { xs: 1.5, md: 2 }
        }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MUIButton variant="text" onClick={() => setShowOffcanvas(true)} sx={{ display: { md: "none" }, minWidth: 0 }}>
              <i className='bx bx-menu' style={{ fontSize: 26, color: "white" }}></i>
            </MUIButton>
            <Typography variant="h5" fontWeight={700} sx={{ color: "white", ml: { xs: 0, md: 2 }, fontSize: { xs: 18, md: 24 } }}>
              Admin Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={user?.profilePictureUrl ? resolveProfileImageUrl(user.profilePictureUrl) : undefined}
              alt={user?.fullName?.charAt(0).toUpperCase() || ''}
              imgProps={{ onError: (e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; } }}
              sx={{ width: 32, height: 32 }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
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

        {/* Main content container */}
        <Container fluid sx={{ background: "#f3f4f6", flex: 1, p: { xs: 2, md: 6 } }}>
          <Card sx={{ borderRadius: 3, p: { xs: 3, md: 6 }, bgcolor: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
            {renderContent()}
          </Card>
        </Container>
      </Box>

      {/* Offcanvas Sidebar */}
      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="start"
        sx={{ bgcolor: "#fff", width: 256, borderRight: "1px solid #e5e7eb" }}>
        <Offcanvas.Header closeButton closeVariant={theme === 'dark' ? 'white' : undefined}>
          <Offcanvas.Title className="fw-bold fs-4">
            <span className="text-primary">G</span>EN-C Login
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 d-flex flex-column">
          <Nav className="flex-column flex-grow-1">
            {menuItems.map(item => (
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

export default AdminDashboard;
