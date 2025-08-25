import React, { useState } from 'react';
import { Menu, Layout } from 'antd';
import { NavLink, Routes, Route } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  ProfileOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import './StudentDashboard.css'
const { Sider, Content } = Layout;

// import Overview from './StudentPages/Overview';
// import GatePassRequest from './StudentPages/GatePassRequest';
// import LateEntry from './StudentPages/LateEntry';
// import Profile from './StudentPages/Profile';

function StudentDashboard() {
  const [collapsed, setCollapsed] = useState(false);

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
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
      </Sider>
      <Layout>
        <Content style={{ margin: '16px' }}>
          {/* Uncomment once pages are implemented */}
          {/* 
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="gatepass" element={<GatePassRequest />} />
            <Route path="lateentry" element={<LateEntry />} />
            <Route path="profile" element={<Profile />} />
          </Routes> 
          */}
        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentDashboard;

