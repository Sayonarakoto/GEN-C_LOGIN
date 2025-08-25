import React, { useState } from "react";
import { Input, Button, Spin, message } from "antd";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const EmailInput = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async () => {
    if (!email) {
      message.error("Please enter an email!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/api/send-reset", {
        email: email,
      });
      message.success(res.data);
    } catch (err) {
      console.error(err);
      message.error("❌ Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Basic email regex to enable submit button only for valid emails
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="container mt-3" style={{ maxWidth: "400px" }}>
      <Input
        type="email"
        value={email}
        onChange={handleChange}
        placeholder="Enter email"
        size="large"
        allowClear
        className="mb-3"
      />
      <Button
        type="primary"
        onClick={handleSubmit}
        disabled={!isValidEmail(email)}
        className="w-100 d-flex justify-content-center align-items-center"
      >
        {loading ? <Spin /> : "Submit"}
      </Button>
    </div>
  );
};

export default EmailInput;
