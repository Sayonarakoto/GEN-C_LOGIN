import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    // Prepare FormData if including file upload
    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('email', values.email);
    formData.append('phoneNumber', values.phoneNumber);
    formData.append('employeeId', values.employeeId);
    formData.append('department', values.department);
    formData.append('designation', values.designation);
    formData.append('joiningDate', values.joiningDate.format('YYYY-MM-DD'));
    formData.append('assignedCourses', values.assignedCourses);
    formData.append('username', values.username);
    formData.append('password', values.password);
    if(values.profilePhoto && values.profilePhoto.file.originFileObj){
      formData.append('profilePhoto', values.profilePhoto.file.originFileObj);
    }
    formData.append('academicQualifications', values.academicQualifications);
    formData.append('specializations', values.specializations);
    formData.append('officeLocation', values.officeLocation);
    formData.append('faxNumber', values.faxNumber);
    formData.append('extension', values.extension);
    formData.append('officeHours', values.officeHours);

    try {
      await axios.post('/api/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      message.success('Registration successful!');
      // Reset form or redirect as needed
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
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          designation: 'Lecturer',
          officeHours: '9:00am - 5:00pm'
        }}
      >
        {/* Personal Details */}
        <h5>Personal Details</h5>
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
          name="phoneNumber"
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter phone number' }]}
        >
          <Input placeholder="Phone Number" />
        </Form.Item>
        <Form.Item
          name="employeeId"
          label="Employee/Faculty ID"
          rules={[{ required: true, message: 'Please enter your ID' }]}
        >
          <Input placeholder="Employee / Faculty ID" />
        </Form.Item>

        {/* Institution Details */}
        <h5>Institution Details</h5>
        <Form.Item
          name="department"
          label="Department"
          rules={[{ required: true, message: 'Please select your department' }]}
        >
          <Select placeholder="Select Department">
            <Option value="Computer Science">Computer Science</Option>
            <Option value="Mechanical">Mechanical</Option>
            <Option value="Electrical">Electrical</Option>
            <Option value="Civil">Civil</Option>
            {/* Add more options as needed */}
          </Select>
        </Form.Item>
        <Form.Item
          name="designation"
          label="Designation/Role"
          rules={[{ required: true, message: 'Please select your role' }]}
        >
          <Select placeholder="Select Role">
            <Option value="Professor">Professor</Option>
            <Option value="Lecturer">Lecturer</Option>
            <Option value="Assistant">Assistant</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="joiningDate"
          label="Joining Date"
          rules={[{ required: true, message: 'Please select your joining date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* Course Information */}
        <h5>Course Information</h5>
        <Form.Item
          name="assignedCourses"
          label="Assigned Courses"
          rules={[{ required: true, message: 'Please enter assigned courses' }]}
        >
          <Input placeholder="E.g. Algorithms, Databases" />
        </Form.Item>

        {/* Authentication */}
        <h5>Authentication</h5>
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please enter a username' }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter a password' }]}
          hasFeedback
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm Password"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm Password" />
        </Form.Item>

        {/* Profile Info */}
        <h5>Profile Info (Optional)</h5>
        <Form.Item name="profilePhoto" label="Profile Photo" valuePropName="fileList" getValueFromEvent={e => e && e.fileList}>
          <Upload beforeUpload={() => false} listType="picture">
            <Button icon={<UploadOutlined />}>Upload Profile Photo</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="academicQualifications" label="Academic Qualifications">
          <Input placeholder="E.g. PhD in Computer Science" />
        </Form.Item>
        <Form.Item name="specializations" label="Specializations">
          <Input placeholder="Specializations" />
        </Form.Item>

        {/* Contact Metadata */}
        <h5>Contact Metadata</h5>
        <Form.Item name="officeLocation" label="Office Location">
          <Input placeholder="Office Location" />
        </Form.Item>
        <Form.Item name="faxNumber" label="Fax Number">
          <Input placeholder="Fax Number" />
        </Form.Item>
        <Form.Item name="extension" label="Extension">
          <Input placeholder="Phone Extension" />
        </Form.Item>
        <Form.Item name="officeHours" label="Office Hours">
          <Input placeholder="E.g. 9:00 AM - 5:00 PM" />
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
