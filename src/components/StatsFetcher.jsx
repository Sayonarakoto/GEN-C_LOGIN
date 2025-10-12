import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { HourglassSplit, Check2Circle, XCircle, ClipboardData } from 'react-bootstrap-icons';

const getIcon = (key) => {
    switch (key.toLowerCase()) {
        case 'pending':
            return <HourglassSplit size={40} className="mb-3 text-warning" />;
        case 'approved':
            return <Check2Circle size={40} className="mb-3 text-success" />;
        case 'rejected':
            return <XCircle size={40} className="mb-3 text-danger" />;
        default:
            return <ClipboardData size={40} className="mb-3 text-primary" />;
    }
};

const StatsFetcher = ({ featureType }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/stats/${featureType}`);
        setStats(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch stats.');
        console.error(`Failed to fetch ${featureType} stats:`, err);
      }
      setLoading(false);
    };

    fetchStats();
  }, [featureType]);

  if (loading) {
    return <div className="d-flex justify-content-center mt-4"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!stats) {
    return null;
  }

  return (
    <Row className="mb-4">
      {Object.entries(stats).map(([key, value]) => (
        <Col xs={12} sm={6} md={3} key={key} className="mb-3">
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              {getIcon(key)}
              <Card.Title as="h6" className="text-muted">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Card.Title>
              <h2 className="fw-bold">{value}</h2>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatsFetcher;