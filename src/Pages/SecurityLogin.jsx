import React, { useState } from "react";
import axios from "axios";
import { Input, Button, Typography, Alert, Space } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";

const { Title, Text } = Typography;

function SecurityLogin() {
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // success or error message
  const [error, setError] = useState(null); // error state

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!passkey) {
      setError("Passkey cannot be empty.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const url = "http://localhost:3001/api/security/submit-passkey";
      const response = await axios.post(url, { passkey });

      setMessage("Success! Passkey submitted.");
      setPasskey(""); // Reset input on success
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Submission failed! Server responded with status: ${err.response?.status || "Network Error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-dark text-light">
      <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
        <Title level={2} className="text-center mb-4" style={{ color: "white" }}>
          Security Login
        </Title>

        <form onSubmit={handleSubmit} className="mb-3">
          <label htmlFor="passkey" className="form-label text-light">
            Passkey:
          </label>
          <Input.Password
            id="passkey"
            placeholder="Enter your passkey"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            size="large"
            autoComplete="off"
            className="mb-3"
          />

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            disabled={loading}
          >
            Login
          </Button>
        </form>

        <Space direction="vertical" style={{ width: "100%" }}>
          {error && <Alert message={error} type="error" showIcon />}
          {message && <Alert message={message} type="success" showIcon />}
          {!error && !message && (
            <Text style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#aaa" }}>
              Please enter your passkey to login.
            </Text>
          )}
        </Space>
      </div>
    </div>
  );
}

export default SecurityLogin;
