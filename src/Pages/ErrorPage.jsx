import React from "react";
import { Button, Card } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';

// Use a root-relative path for public assets
const catImageUrl = '/images/cat-error.jpg'; 

export default function ErrorPage({ 
  title = "404 - Page Not Found", 
  subTitle = "Oops! The page you're looking for doesn't exist or has been moved." 
}) {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/');
  };

  return (
    <div className="error-page-main-bg" style={{ width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card className="error-page-card-bg mx-auto p-4 position-relative" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-0 text-center">
          <h2 style={{ color: "#00e1ff", marginBottom: 16 }}>
            {title}
          </h2>
          <p style={{ color: "#a0a0a0", marginBottom: 30 }}>
            {subTitle}
          </p>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img
              src={catImageUrl}
              alt="Curious Cat"
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }}
            />
          </div>
          
          <Button
            onClick={handleButtonClick}
            style={{
              padding: "10px 20px",
              borderRadius: 20,
              background: "#00e1ff",
              color: "#1a1a1a",
              border: "none",
              transition: "background 0.3s",
            }}
          >
            Go to Homepage
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
