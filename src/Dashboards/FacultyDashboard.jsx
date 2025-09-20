import React, { useState } from "react";
import { Layout, Menu, message } from "antd";
import {
  UserAddOutlined,
  HomeOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  ClockCircleOutlined, // Added for Late Entries
} from "@ant-design/icons";
import StudentEntryForm from "../faculty/StudentEntryForm";
import FacultyLateEntries from "../faculty/FacultyLateEntries"; // Import the new component
import {  Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-hooks";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("home");
  
  const { logout, user } = useAuth(); // Destructure user from useAuth
  const navigate = useNavigate();

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const handleLogout = () => {
    logout();
    message.success("You have been logged out.");
    navigate('/faculty-login');
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "studentEntry":
        return <StudentEntryForm />;
      case "approvals":
        return <h2>Approvals Page (Coming Soon)</h2>;
      case "lateEntries":
        return <FacultyLateEntries />;
      case "home":
      default:
        return <h2>Welcome{user?.name ? `, ${user.name}` : ''}!</h2>; // Personalized greeting
    }
  };

  return (
    <Layout className="faculty-dashboard">
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
                key: 'studentEntry',
                icon: <UserAddOutlined />,
                label: 'Student Entry',
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
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header className="dashboard-header">Welcome, Faculty</Header>
        <Content className="dashboard-content">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}

export default FacultyDashboard;