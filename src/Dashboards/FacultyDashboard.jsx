import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Badge,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  Menu as MenuIcon,
  NotificationsOutlined,
  LogoutOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  DescriptionOutlined,
  AccessTime,
  UploadFile,
  ErrorOutline,
  CheckCircleOutline,
  Group as GroupIcon, // For Student Management
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../api/client';
import FacultyLateEntries from "../faculty/FacultyLateEntries";
import LateEntriesApprovals from "../faculty/LateEntriesApprovals";
import ExcelUpload from "../faculty/ExcelUpload";
import StudentTable from "../faculty/StudentTable";
import useToastService from '../hooks/useToastService';
// import "./Dashboard.css"; // Keep if custom styles are still needed, otherwise remove

const drawerWidth = 240;

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("approvals");
  const [allStudents, setAllStudents] = useState([]);
  const [stats, setStats] = useState({ pending: 0, lateToday: 0, approved: 0, alerts: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMdScreen = useMediaQuery("(min-width:900px)");

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToastService();

  const refreshStats = useCallback(async () => {
    try {
      const response = await api.get('/api/latecomers/faculty/stats');
      if (response.data && response.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          pending: response.data.data.pending,
          approved: response.data.data.approved,
          lateToday: response.data.data.todayEntry, // Map backend's todayEntry to frontend's lateToday
          alerts: response.data.data.alerts, // Map backend's alerts to frontend's alerts
        }));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error('Failed to refresh dashboard stats.');
    }
  }, [toast]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await api.get(`/api/students`);
      setAllStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load student data.');
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
      toast.success("You have been logged out.");
      navigate('/');
    } else {
      setSelectedKey(key);
    }
    setMobileOpen(false); // Close drawer on item click
  };

  const handleUploadSuccess = () => {
    toast.success("Student data uploaded successfully!");
    fetchAllStudents();
  };

  const menuItems = [
    { key: 'approvals', icon: <DescriptionOutlined />, label: 'Approvals' },
    { key: 'lateEntries', icon: <AccessTime />, label: 'All Late Entries' },
    { key: 'uploadStudents', icon: <UploadFile />, label: 'Upload Students' },
    { key: 'manageStudents', icon: <GroupIcon />, label: 'Manage Students' },
  ];

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", borderBottom: 1, borderColor: "#e5e7eb" }}>
        <Typography component="span" sx={{ color: "#3b82f6", fontWeight: 700, fontSize: 24 }}>
          G
        </Typography>
        <Typography
          component="span"
          sx={{
            color: "#374151",
            fontWeight: 700,
            fontSize: 20,
            marginLeft: 1,
          }}
        >
          EN-C Login
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            component="button"
            key={item.key}
            selected={selectedKey === item.key}
            onClick={() => handleMenuClick(item.key)}
            sx={{
              color: selectedKey === item.key ? "#3b82f6" : "#475569",
              backgroundColor: selectedKey === item.key ? "#e0f2fe" : "transparent",
              fontWeight: selectedKey === item.key ? 600 : 400,
              "& .MuiSvgIcon-root": { color: selectedKey === item.key ? "#3b82f6" : "#475569" },
            }}
          >
            <ListItemIcon
              sx={{
                color: selectedKey === item.key ? "#3b82f6" : "#475569",
                minWidth: 36,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ mt: "auto", p: 2 }}>
        <List>
          <ListItem component="button" onClick={() => handleMenuClick('logout')}>
            <ListItemIcon>
              <LogoutOutlined sx={{ color: "#475569" }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

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
      default:
        return <Typography>Select an option from the menu.</Typography>;
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f3f4f6", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar/Drawer */}
      <Drawer
        variant={isMdScreen ? "permanent" : "temporary"}
        open={isMdScreen || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          borderRight: 1,
          borderColor: "#e5e7eb",
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main section */}
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, overflow: "hidden" }}>
        {/* AppBar/Header */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: "#fff", borderBottom: 1, borderColor: "#e5e7eb" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {!isMdScreen && (
                <IconButton edge="start" sx={{ color: "#475569" }} onClick={() => setMobileOpen(!mobileOpen)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ color: "#111827", fontWeight: 700, marginLeft: 2 }}>
                Faculty Dashboard
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                    icon={<LightModeOutlined />}
                    checkedIcon={<DarkModeOutlined />}
                  />
                }
                label=""
              />
              <Badge color="primary" badgeContent={stats.alerts} max={99}>
                <NotificationsOutlined sx={{ color: "#475569" }} />
              </Badge>
              <Avatar
                alt="Faculty profile"
                src={user?.profilePhoto ? `http://localhost:3001/uploads/${user.profilePhoto}` : ''}
              />
              <Stack direction="column" alignItems="flex-end">
                <Typography variant="subtitle1" sx={{ color: "#111827", fontWeight: 600 }}>
                  Hi, {user?.fullName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Department: {user?.department}
                </Typography>
              </Stack>
              <IconButton onClick={() => handleMenuClick('logout')} color="inherit">
                <LogoutOutlined />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f3f4f6", minHeight: "100vh" }}>
          {/* Statistics */}
          <Grid container spacing={2} mb={3}>
            <Grid>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
                  Pending Requests
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: "#eab308" }}>
                  {stats.pending}
                </Typography>
                <ErrorOutline sx={{ color: "#eab308", fontSize: 40, position: 'absolute', right: 16, bottom: 16 }} />
              </Paper>
            </Grid>
            <Grid>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
                  Late Entries Today
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: "#3b82f6" }}>
                  {stats.lateToday}
                </Typography>
                <AccessTime sx={{ color: "#3b82f6", fontSize: 40, position: 'absolute', right: 16, bottom: 16 }} />
              </Paper>
            </Grid>
            <Grid>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
                  Approved Late Entries
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: "#22c55e" }}>
                  {stats.approved}
                </Typography>
                <CheckCircleOutline sx={{ color: "#22c55e", fontSize: 40, position: 'absolute', right: 16, bottom: 16 }} />
              </Paper>
            </Grid>
            <Grid>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: "#6b7280" }}>
                  Security Alerts
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: "#ef4444" }}>
                  {stats.alerts}
                </Typography>
                <ErrorOutline sx={{ color: "#ef4444", fontSize: 40, position: 'absolute', right: 16, bottom: 16 }} />
              </Paper>
            </Grid>
          </Grid>

          {/* Dynamic Content based on selectedKey */}
          <Paper sx={{ borderRadius: 2, p: { xs: 1, md: 3 } }}>
            {renderContent()}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default FacultyDashboard;
