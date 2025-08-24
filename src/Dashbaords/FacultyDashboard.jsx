import React, { useState } from "react";
import { Layout, Menu } from "antd";
import {
  UserAddOutlined,
  HomeOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import StudentEntryForm from "../faculty/StudentEntryForm";
import { Link } from 'react-router-dom';
const { Header, Sider, Content } = Layout;

function FacultyDashboard() {
  const [selectedKey, setSelectedKey] = useState("home");

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  // Page Switching Logic
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
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider collapsible>
        <div
          className="logo"
          style={{ color: "white", textAlign: "center", padding: "1rem" }}
        >
          Faculty Panel
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["home"]}
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
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
          <Menu.Item key="logout" icon={<LogoutOutlined />}>
            <Link to="/home">logout</Link>
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main Layout */}
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: 0,
            textAlign: "right",
            paddingRight: "2rem",
          }}
        >
          Welcome, Faculty
        </Header>

        <Content
          style={{
            margin: "1rem",
            background: "#fff",
            padding: "2rem",
            borderRadius: "8px",
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default FacultyDashboard;
