import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, List, Card, Typography, Row, Col, Spin, Layout, Menu } from 'antd';
import { LogoutOutlined, QrcodeOutlined, FormOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-hooks';
import api from '../api/client';
import './Dashboard.css';

const { Title, Text } = Typography;
const { Sider, Content, Header } = Layout;

const RecentEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentEntries = async () => {
      try {
        const response = await api.get('/api/lateentries/recent');
        setEntries(response.data);
      } catch (err) {
        message.error('Failed to load recent entries.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecentEntries();
  }, []);

  if (loading) {
    return <Spin />;
  }

  return (
    <List
      header={<Text strong>Recent Entries</Text>}
      bordered
      dataSource={entries}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={<Text>{item.studentId}</Text>}
            description={`Gate: ${item.gate} - ${new Date(item.recordedAt).toLocaleTimeString()}`}
          />
          <Text type="secondary">{item.reason}</Text>
        </List.Item>
      )}
    />
  );
};

const SecurityDashboard = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  

  const handleLogout = () => {
    logout();
    message.success('You have been logged out.');
    navigate('/security-login');
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.post('/api/lateentries', { ...values, recordedAt: new Date().toISOString() });
      message.success('Late entry recorded successfully');
      form.resetFields();
    } catch (error) {
      console.error('Error recording late entry:', error);
      message.error(error.response?.data?.message || 'Failed to record late entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', textAlign: 'center', lineHeight: '32px' }}>
          Security
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Logout',
              onClick: handleLogout,
            },
          ]}
        />
        </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Title level={4} style={{ margin: '16px 0' }}>Security Dashboard</Title>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div className="dashboard-content" style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={<><QrcodeOutlined style={{ marginRight: 8 }} /> Scan Student ID</>}
                  bordered={false}
                  style={{ textAlign: 'center', height: '100%' }}
                >
                  <div style={{
                    height: '300px',
                    backgroundColor: '#000',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    flexDirection: 'column'
                  }}>
                    <Text style={{ color: '#fff', marginBottom: '1rem' }}>QR Code Scanner Placeholder</Text>
                    <Button type="primary" size="large">Activate Scanner</Button>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title={<><FormOutlined style={{ marginRight: 8 }} /> Manual Entry</>} bordered={false}>
                  <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                      label="Student ID"
                      name="studentId"
                      rules={[{ required: true, message: 'Please enter the student ID' }]}
                    >
                      <Input size="large" placeholder="Enter Student ID" />
                    </Form.Item>
                    <Form.Item
                      label="Reason"
                      name="reason"
                      rules={[{ required: true, message: 'Please enter the reason' }]}
                    >
                      <Input.TextArea rows={3} placeholder="Reason for being late" />
                    </Form.Item>
                    <Form.Item
                      label="Gate"
                      name="gate"
                      rules={[{ required: true, message: 'Please enter the gate number' }]}
                    >
                      <Input size="large" placeholder="Enter Gate Number" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                        Record Late Entry
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
            <Row style={{ marginTop: 24 }}>
              <Col span={24}>
                  <Card title="Recent Activity" bordered={false}>
                      <RecentEntries />
                  </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SecurityDashboard;