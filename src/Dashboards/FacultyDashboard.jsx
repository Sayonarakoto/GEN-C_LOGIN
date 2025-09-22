import React, { useState, useEffect } from "react";
import { Layout, Menu, message, Card, Button } from "antd";
import {
  HomeOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  ClockCircleOutlined, // Added for Late Entries
  UploadOutlined, // New icon for upload
} from "@ant-design/icons";
import FacultyLateEntries from "../faculty/FacultyLateEntries"; // Import the new component
import LateEntriesApprovals from "../faculty/LateEntriesApprovals"; // Import the new component
import ExcelUpload from "../components/ExcelUpload"; // Import the new ExcelUpload component
import StudentTable from "../components/StudentTable"; // Import the new StudentTable component
import {  Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from 'axios'; // Import axios for fetching students
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("home");
  const [allStudents, setAllStudents] = useState([]); // State to hold all student data
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const { logout, user } = useAuth(); // Destructure user from useAuth
  const navigate = useNavigate();

  // Function to fetch all students
  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_BASE_URL}/api/students`, {
        headers: {
          Authorization: `Bearer ${user?.token}` // Add authentication if available
        }
      });
      setAllStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('Failed to load student data.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch students when the component mounts or when the uploadStudents tab is selected
  useEffect(() => {
    if (selectedKey === 'uploadStudents') {
      fetchAllStudents();
    }
  }, [selectedKey]);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const handleLogout = () => {
    logout();
    message.success("You have been logged out.");
    navigate('/faculty-login');
  };

  const handleUploadSuccess = (data) => {
    message.success("Student data uploaded successfully!");
    // After successful upload, refetch all students to update the table
    fetchAllStudents(); 
    console.log("Uploaded student data:", data);
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "approvals":
        return <LateEntriesApprovals />;
      case "lateEntries":
        return <FacultyLateEntries />;
      case "uploadStudents":
        return (
          <div>
            <ExcelUpload onUploadSuccess={handleUploadSuccess} />
            {loadingStudents ? (
              <p>Loading student data...</p>
            ) : (
              allStudents.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3>All Students:</h3>
                  <StudentTable students={allStudents} />
                </div>
              )
            )}
          </div>
        );
      case "home":
      default:
        return (
          <div>
            <h2 style={{ color: 'var(--text-light)' }}>Welcome{user?.name ? `, ${user.name}` : ''}!</h2>
            <Card title="Quick Actions" style={{ marginTop: '20px' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setSelectedKey('uploadStudents')}
              >
                Upload Student Data
              </Button>
            </Card>
          </div>
        ); // Personalized greeting and Quick Actions Card
    }
  };

  return (
    <Layout className="dashboard-layout">
      {/* Sidebar */}
      <Sider collapsible>
        <div className="dashboard-logo">Faculty Panel</div>

        <div className="dashboard-sider">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            className="dashboard-menu"
            items={[
              {
                key: 'home',
                icon: <HomeOutlined />,
                label: 'Home',
              },
              {
                key: 'uploadStudents', // New menu item
                icon: <UploadOutlined />, // New icon
                label: 'Upload Students',
              },
              {
                key: 'approvals',
                icon: <FileDoneOutlined />,
                label: 'Approvals',
              },
              {
                key: 'lateEntries',
                icon: <ClockCircleOutlined />,
                label: 'Late Entries',
              },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: handleLogout,
                className: 'dashboard-logout',
              },
            ]}
          />
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header className="dashboard-header">Welcome, Faculty</Header>
        <Content className="dashboard-content">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default FacultyDashboard;
