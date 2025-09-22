import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ status = "404", title = "404", subTitle = "Sorry, the page you visited does not exist." }) => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
      extra={<Button type="primary" onClick={handleBackHome}>Back Home</Button>}
    />
  );
};

export default ErrorPage;
