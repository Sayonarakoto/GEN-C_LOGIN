import React from "react";
import { Form, Input, Button, Select, message } from "antd";
import axios from "axios";

const { Option } = Select;

function StudentEntryForm() {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
  try {
    const res = await axios.post("http://localhost:3001/student/StudentForm", values);
    message.success(res.data.message);
    console.log("✅ API response:", res.data);
    form.resetFields();
  } catch (err) {
    console.error("❌ API error:", err);
    message.error(err.response?.data?.message || "Error creating student");
  }
};

  return (
    <Form
  form={form}
  layout="vertical"
  onFinish={onFinish}
  style={{ maxWidth: "500px", margin: "0 auto" }}
>
  <Form.Item
    name="studentId"
    label="Student ID"
    rules={[{ required: true, message: "Please enter student ID" }]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    name="fullName"
    label="Full Name"
    rules={[{ required: true, message: "Please enter student name" }]}
  >
    <Input />
  </Form.Item>

  <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
    <Input />
  </Form.Item>

  <Form.Item
    name="department"
    label="Department"
    rules={[{ required: true, message: "Please select department" }]}
  >
    <Select placeholder="Select department">
      <Option value="CT">CT</Option>
      <Option value="EEE">EEE</Option>
      <Option value="MECH-A">MECH-A</Option>
      <Option value="MECH-B">MECH-B</Option>
      <Option value="FS">FS</Option>
      <Option value="CE">CIVIL</Option> {/* ✅ match backend enum */}
      <Option value="AUTOMOBILE">AUTOMOBILE</Option> {/* ✅ spelling fix */}
    </Select>
  </Form.Item>

  <Form.Item
    name="year"
    label="Year"
    rules={[{ required: true, message: "Please select Year" }]}
  >
    <Select placeholder="Select year">
      <Option value="1st">1ST</Option>
      <Option value="2nd">2ND</Option>
      <Option value="3rd">3RD</Option>
    </Select>
  </Form.Item>

  <Form.Item
    name="password"
    label="Temporary Password"
    rules={[{ required: true, message: "Please enter a password" }]}
  >
    <Input.Password />
  </Form.Item>

  <Form.Item>
    <Button type="primary" htmlType="submit" block>
      Create Student
    </Button>
  </Form.Item>
</Form>

  );
}

export default StudentEntryForm;
