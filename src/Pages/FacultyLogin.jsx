import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title } = Typography;
const glassStyle = {
  background: "rgba(255,255,255,0.2)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)"
};

function FacultyLogin() {
  const [loading, setLoading] = useState(false);

  const onFinish = ({ facultyId, password }) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (facultyId === "gemini" && password === "access_granted") {
        message.success("Login successful! Redirecting...");
      } else {
        message.error("Invalid Faculty ID or password.");
      }
    }, 1200);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        fontFamily: '"Inter", sans-serif',
        background: "linear-gradient(135deg, #16a085, #2980b9)"
      }}
    >
      <Card style={glassStyle} className="w-100" bodyStyle={{ padding: 32 }}>
        <Title level={2} style={{ color: "#fff", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          Faculty Login
        </Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span style={{ color: "#eee" }}>Faculty ID</span>}
            name="facultyId"
            rules={[{ required: true, message: "Please enter your Faculty ID." }]}
          >
            <Input size="large" placeholder="Enter your Faculty ID" style={{ background: "rgba(51,51,51,0.20)", color: "#fff" }} />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: "#eee" }}>Password</span>}
            name="password"
            rules={[{ required: true, message: "Please enter your password." }]}
          >
            <Input.Password size="large" placeholder="••••••••" style={{ background: "rgba(51,51,51,0.20)", color: "#fff" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ borderRadius: 12 }}>
            Sign In
          </Button>
        </Form>
        <div className="text-center mt-3">
          <a href="#" style={{ color: "#eee" }}>Forgot Password?</a>
        </div>
      </Card>
    </div>
  );
}

export default FacultyLogin;
