import React, { useState } from 'react';
import { Form, Input, Button, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('email', values.email);
    formData.append('employeeId', values.employeeId); // Faculty ID
    formData.append('department', values.department);
    formData.append('designation', values.designation);
    if(values.profilePhoto && values.profilePhoto.file.originFileObj){
      formData.append('profilePhoto', values.profilePhoto.file.originFileObj);
    }

    try {
      await axios.post('http://localhost:3001/api/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Registration successful!');
    } catch (error) {
      console.error(error);
      message.error('Registration failed! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '700px' }}>
      <h2 className="mb-4 text-center">Register</h2>
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
            <Option value="auto">AUTO MOBLIE</Option>
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
        >
          <Upload beforeUpload={() => false} listType="picture">
            <Button icon={<UploadOutlined />}>Upload Profile Photo</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Register
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Register;
