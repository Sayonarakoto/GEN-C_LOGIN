import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spinner, Alert, Button } from 'react-bootstrap';
import api from '../api/client';
import useToastService from '../hooks/useToastService';

const DeclinedRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const toast = useToastService();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/latecomers/${requestId}`);
        if (response.data) {
          setRequest(response.data.lateEntry);

        } else {
          throw new Error('Failed to fetch request details');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching request details.');
        toast.error(err.response?.data?.message || 'Failed to fetch request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId, toast]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-3">Error: {error}</Alert>;
  }

  if (!request) {
    return <Alert variant="warning" className="mt-3">Request details not found.</Alert>;
  }

  return (
    <Card className="mt-5 mx-auto" style={{ maxWidth: 800 }}>
      <Card.Header as="h5">Rejected Request Details</Card.Header>
      <Card.Body>
        <p><strong>Request ID:</strong> {request._id}</p>
        <p><strong>Reason:</strong> {request.reason}</p>
        <p><strong>Status:</strong> {request.status}</p>
        <p><strong>Date Submitted:</strong> {new Date(request.date).toLocaleString()}</p>

        {request.rejectionReason && (
          <Alert variant="danger" className="mt-3">
            <strong>Faculty Feedback:</strong> {request.rejectionReason}
          </Alert>
        )}

        <Button 
          variant="primary" 
          className="mt-3"
          disabled={request.status !== 'Rejected'}
          onClick={() => navigate(`/student/submit-entry/${request._id}?action=edit`)}
        >
          Edit and Resubmit
        </Button>
      </Card.Body>
    </Card>
  );
};

export default DeclinedRequestDetails;
