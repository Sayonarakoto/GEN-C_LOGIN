import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";  // ✅ add navigation
import "bootstrap/dist/css/bootstrap.min.css";
import "./Frontpage.css";

const { Title } = Typography;

const cardStyle = {
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
  padding: "2rem",
  border: "1px solid #E0E0E0",
};

function FacultyLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ✅ use react-router navigation

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/auth/faculty-login", {
        employeeId: values.facultyId,  // 🔑 map correctly
        password: values.password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("facultyData", JSON.stringify(res.data.faculty));

        message.success(res.data.message);

        // ✅ safer redirect handled by React Router
        navigate("/faculty");
      }
    } catch (err) {
      console.error("Login error:", err);
      message.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        fontFamily: '"Inter", sans-serif',
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <div style={cardStyle} className="auth-box">
              <Title
                level={2}
                className="auth-title text-center"
                style={{ color: "#263238", marginBottom: "1.5rem" }}
              >
                Faculty Login
              </Title>
              <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                <Form.Item
                  label={<span style={{ color: "#263238" }}>Faculty ID</span>}
                  name="facultyId"
                  rules={[{ required: true, message: "Please enter your Faculty ID." }]}
                >
                  <Input size="large" placeholder="Enter your Faculty ID" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: "#263238" }}>Password</span>}
                  name="password"
                  rules={[{ required: true, message: "Please enter your password." }]}
                >
                  <Input.Password size="large" placeholder="••••••••" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{
                    borderRadius: 10,
                    backgroundColor: "#008080",
                    borderColor: "#005f73",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Button>
              </Form>

              <div className="text-center mt-3">
                <a href="#" style={{ color: "#005f73", fontWeight: 500 }}>
                  Forgot Password?
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default FacultyLogin;
