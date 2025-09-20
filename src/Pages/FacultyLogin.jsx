import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-hooks";
import client from '../api/client'; // Corrected import
import "bootstrap/dist/css/bootstrap.min.css";
import "./Frontpage.css";

const { Title, Text, Link } = Typography;

const cardStyle = {
  maxWidth: "400px",
  margin: "2rem auto",
  padding: "2rem",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  borderRadius: "8px",
  background: "#fff",
};

function FacultyLogin() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await client.post('/auth/faculty-login', {
        employeeId: values.employeeId,
        password: values.password,
      });
      if (response.data.success) {
        message.success(response.data.message);
        login(response.data.token); // Pass only the token to AuthContext's login
        navigate('/faculty');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    navigate("/send-reset");
  };
  const handleGetStartedClick = () => {
    navigate("/register");
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
              <div style={{ marginTop: "8px" }}>
                <Text style={{ color: "#6B7280" }}>
                  Don’t have an account?{" "}
                  <Link
                    onClick={handleGetStartedClick}
                    style={{ color: "#2563EB", cursor: "pointer" }}
                  >
                    Get started
                  </Link>
                </Text>
              </div>
              <Form
                form={form}
                name="faculty_login"
                onFinish={onFinish}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  label={<span style={{ color: "#263238" }}>Employee ID</span>}
                  name="employeeId"
                  rules={[
                    { required: true, message: "Please enter your Employee ID." },
                  ]}
                >
                  <Input size="large" placeholder="Enter your Employee ID" />
                </Form.Item>

                <Form.Item
                  label={<span style={{ color: "#263238" }}>Password</span>}
                  name="password"
                  rules={[{ required: true, message: "Please enter your password." }]}
                >
                  <Input.Password size="large" placeholder="Enter your password" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={loading}
                    style={{
                      borderRadius: 10,
                      backgroundColor: "#008080",
                      borderColor: "#005f73",
                      color: "#ffffff",
                      fontWeight: 600,
                    }}
                  >
                    Login
                  </Button>
                </Form.Item>

                <div className="text-center mt-3">
                  <Link
                    onClick={handleForgotPasswordClick}
                    style={{
                      color: "#005f73",
                      fontWeight: 500,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Forgot Password?
                  </Link>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default FacultyLogin;