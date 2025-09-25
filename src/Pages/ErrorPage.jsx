import React, { useState } from "react";
import { Button, Card } from "react-bootstrap"; // Import Bootstrap Button and Card
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Use the local cat image
const catImageUrl = `${import.meta.env.BASE_URL}images/cat-error.jpg`; 

export default function ErrorPage({ title = "Lost in the Digital Woods?", subTitle = "Don't worry, we'll help you find your way back." }) {
  const [showSecret, setShowSecret] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [buttonText, setButtonText] = useState("Return to Safety");
  const navigate = useNavigate(); // Initialize useNavigate



  const handleButtonClick = () => {
    navigate('/');
  };

  return (
    <div className="error-page-main-bg" style={{ width: '100vw' }}>
      <Card className="error-page-card-bg mx-auto my-5 p-4 position-relative w-100">
        <Card.Body className="p-0"> {/* Use Card.Body for padding */}
          <div style={{ height: 80 }} />
          <h2 style={{ color: "#00e1ff", textAlign: "center", marginBottom: 16 }}>
            {title}
          </h2>
          <p style={{ display: "block", color: "#a0a0a0", textAlign: "center", marginBottom: 30 }}>
            {subTitle} <br />
            Try clicking around to see if you can uncover the path.
          </p>

          <div className="error-page-card-bg" style={{
            position: "relative",
            minHeight: 260,
            maxWidth: 400,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Removed orbPulseStyle divs */}

            <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
              <img
                src={catImageUrl}
                alt="Curious Cat"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                onClick={() => {
                  setShowSecret(true);
                  setButtonText("Follow the Path");
                }}
                tabIndex={0}
                role="button"
                aria-label="Click to reveal secret path"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowSecret(true);
                    setButtonText("Follow the Path");
                  }
                }}
              />

              <p style={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>Meow! Click the Cat!</p>
              <p style={{ color: "#cbd5e1", fontSize: 14, marginTop: 10 }}>A secret path awaits...</p>
              {showSecret && (
                <p className="secret-message">You found a secret path! This way to the homepage!</p>
              )}
            </div>
            <Button
              onClick={handleButtonClick}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 20,
                background: btnHover ? "linear-gradient(to right, #00c6ff, #0072ff)" : "#00e1ff",
                color: "#1a1a1a",
                border: "none",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{buttonText}</span>
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
