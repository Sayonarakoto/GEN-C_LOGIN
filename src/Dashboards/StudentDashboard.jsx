import React, { useState } from 'react';
import { Menu, Layout, message } from 'antd';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  ProfileOutlined,
  HomeOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import LateEntry from '../student/LateEntry';
import StudentLateEntry from '../student/StudentLateEntry';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;

function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  const handleLogout = () => {
    logout();
    message.success('You have been logged out.');
    navigate('/signin');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 🔹 Top Navigation Menu */}
          <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" style={{ flex: 1 }}>
            <Menu.Item key="1" icon={<HomeOutlined />}>
              <NavLink to="/student" end>Overview</NavLink>
            </Menu.Item>
            <Menu.Item key="2" icon={<FileTextOutlined />}>
              <NavLink to="/student/gatepass">Gate Pass</NavLink>
            </Menu.Item>
            <Menu.Item key="3" icon={<ProfileOutlined />}>
              <NavLink to="/student/lateentry">Late Entry</NavLink>
            </Menu.Item>
            <Menu.Item key="4" icon={<UserOutlined />}>
              <NavLink to="/student/profile">Profile</NavLink>
            </Menu.Item>
          </Menu>

          {/* 🚪 Logout Button at Bottom */}
          <Menu theme="dark" mode="inline">
            <Menu.Item
              key="logout"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: '#ff4d4f', fontWeight: 500 }}
            >
              Logout
            </Menu.Item>
          </Menu>
        </div>
      </Sider>

      <Layout>
        <Content style={{ margin: '16px' }}>
          <h2>Welcome{user?.name ? `, ${user.name}` : ''}!</h2>
          {/* Uncomment once pages are implemented */}
          <Routes>
            <Route path="/" element={<div>Student Overview Content</div>} />
            {/* <Route path="gatepass" element={<GatePassRequest />} /> */}
            <Route path="lateentry" element={<StudentLateEntry />} />
            {/* <Route path="profile" element={<Profile />} /> */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentDashboard;