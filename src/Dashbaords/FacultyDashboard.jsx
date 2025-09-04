import React, { useState } from "react";
import { Layout, Menu, message } from "antd";
import {
  UserAddOutlined,
  HomeOutlined,
  FileDoneOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import StudentEntryForm from "../faculty/StudentEntryForm";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const { Header, Sider, Content } = Layout;

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("home");
  const navigate = useNavigate();

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const handleLogout = () => {
    // Clear user data from local storage and session storage
    localStorage.removeItem("facultyToken");
    sessionStorage.removeItem("facultyToken");

    message.success("You have been logged out.");

    // Redirect the user to the signin page
    navigate("/faculty-login");
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "studentEntry":
        return <StudentEntryForm />;
      case "approvals":
        return <h2>Approvals Page (Coming Soon)</h2>;
      case "home":
      default:
        return <h2>Welcome to Faculty Dashboard</h2>;
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
          >
            <Menu.Item key="home" icon={<HomeOutlined />}>
              Home
            </Menu.Item>
            <Menu.Item key="studentEntry" icon={<UserAddOutlined />}>
              Student Entry
            </Menu.Item>
            <Menu.Item key="approvals" icon={<FileDoneOutlined />}>
              Approvals
            </Menu.Item>

            {/* Logout item at the end of the menu */}
            <Menu.Item
              key="logout"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="dashboard-logout" // Add a class for styling
            >
              Logout
            </Menu.Item>
          </Menu>
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