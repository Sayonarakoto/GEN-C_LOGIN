import React, { useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api from '../api/client';
import LoginCard from '../components/common/LoginCard';

const { Option } = Select;
const { Title } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      // Password match check
      if (values.password !== values.confirmPassword) {
        message.error("Passwords do not match!");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('fullName', values.fullName);
      formData.append('email', values.email);
      formData.append('employeeId', values.employeeId);
      formData.append('department', values.department);
      formData.append('designation', values.designation);
      formData.append('password', values.password);

      // Check file size before upload
      if (values.profilePhoto?.[0]?.originFileObj) {
        const file = values.profilePhoto[0].originFileObj;
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Profile photo must be smaller than 5MB');
        }
        formData.append('profilePhoto', file);
      }

      const response = await api.post('/api/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        message.success('Registration successful!');
        // Optional: Clear form or redirect
       // form.resetFields();
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration failed! Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LoginCard>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-dark)' }}>Register</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
              { required: true, message: 'Email is required' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="employeeId"
            label="Faculty ID"
            rules={[{ required: true, message: 'Please enter your Faculty ID' }]}
          >
            <Input placeholder="Faculty ID" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[{ required: true, message: 'Please confirm the password' }]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: 'Please select your department' }]}
          >
            <Select placeholder="Select Department">
              <Option value="ct">CT</Option>
              <Option value="mech-a">Mechanical-A</Option>
              <Option value="mech-b">Mechanical-B</Option>
              <Option value="eee">Electrical</Option>
              <Option value="ce">Civil</Option>
              <Option value="fs">FS</Option>
              <Option value="auto">AUTOMOBILE</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="designation"
            label="Designation/Role"
            rules={[{ required: true, message: 'Please select your role' }]}
          >
            <Select placeholder="Select Role">
              <Option value="hod">HOD</Option>
              <Option value="faculty">FACULTY</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="profilePhoto"
            label="Profile Photo"
            valuePropName="fileList"
            getValueFromEvent={e => e && e.fileList}
            rules={[
              {
                validator: async (_, fileList) => {
                  if (fileList && fileList.length > 0) {
                    const file = fileList[0].originFileObj;
                    if (file.size > 5 * 1024 * 1024) {
                      throw new Error('Image must be smaller than 5MB!');
                    }
                    if (!['image/jpeg', 'image/png'].includes(file.type)) {
                      throw new Error('Only JPG/PNG files are allowed!');
                    }
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Upload 
              beforeUpload={() => false}
              listType="picture"
              accept=".jpg,.jpeg,.png"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Upload Profile Photo</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form.Item>
        </Form>
      </LoginCard>
    </div>
  );
};

export default Register;
