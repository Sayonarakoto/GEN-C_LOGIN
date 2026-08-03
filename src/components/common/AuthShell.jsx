import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Logo from './Logo';

const AuthShell = ({
  title,
  subtitle,
  children,
  sideTitle,
  sideDescription,
  sideImage,
  sideAccent,
  footer,
  compact = false,
}) => {
  return (
    <Container fluid className="login-shell p-0">
      <Row className="g-0 min-vh-100">
        <Col xs={12} lg={5} className="login-form-panel">
          <div className="glass-card">
            <div className="mb-6 text-center">
              <div className="brand-mark">
                <Logo />
              </div>
              <h1 className="login-title">{title}</h1>
              {subtitle && <p className="login-subtitle">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-4 text-center">{footer}</div>}
          </div>
        </Col>

        <Col xs={12} lg={7} className="login-visual-panel d-none d-lg-block">
          {sideImage ? (
            <img src={sideImage} alt={sideTitle || 'Auth cover'} className="cover-image" />
          ) : null}

          <div className="visual-overlay" />
          {sideAccent ? <div className="visual-layer visual-layer-top">{sideAccent}</div> : null}

          <div className="visual-content">
            <div className="caption-strip">
              <span className="caption-kicker">GEN C</span>
              <h2>{sideTitle || 'Secure campus access'}</h2>
              <p>{sideDescription || 'Access your workspace with a streamlined enterprise experience.'}</p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthShell;
