import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Tabs,
  Tab,
  Badge,
} from 'react-bootstrap';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import StatsFetcher from '../components/StatsFetcher';

const getApproverDisplay = (pass) => {
  if (pass.hod_status === 'APPROVED' && pass.hod_approver_id?.fullName) {
    return `${pass.hod_approver_id.fullName} (${pass.hod_approver_id.designation || 'HOD'})`;
  }
  if (pass.faculty_status === 'APPROVED' && pass.faculty_id?.fullName) {
    return `${pass.faculty_id.fullName} (${pass.faculty_id.designation || 'Faculty'})`;
  }
  if (pass.hod_status === 'REJECTED' && pass.hod_approver_id?.fullName) {
    return `Rejected by ${pass.hod_approver_id.fullName} (${pass.hod_approver_id.designation || 'HOD'})`;
  }
  if (pass.faculty_status === 'REJECTED' && pass.faculty_id?.fullName) {
    return `Rejected by ${pass.faculty_id.fullName} (${pass.faculty_id.designation || 'Faculty'})`;
  }
  if (pass.hod_status === 'PENDING' && pass.faculty_status === 'APPROVED' && pass.faculty_id?.fullName) {
    return `Forwarded by ${pass.faculty_id.fullName} (${pass.faculty_id.designation || 'Faculty'}) to HOD`;
  }
  if (pass.faculty_status === 'PENDING' && pass.faculty_id?.fullName) {
    return `Pending with ${pass.faculty_id.fullName} (${pass.faculty_id.designation || 'Faculty'})`;
  }
  return 'N/A';
};

const PendingRequests = ({ pendingRequests, onApprove, onReject, loading, error }) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Exit Time</th>
          <th>Return Time</th>
          <th>Reason</th>
          <th className="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <tr key={request._id}>
              <td>{request.student_id?.fullName}</td>
              <td>{new Date(request.date_valid_from).toLocaleTimeString()}</td>
              <td>{request.date_valid_to ? new Date(request.date_valid_to).toLocaleTimeString() : 'N/A'}</td>
              <td>{request.reason}</td>
              <td className="text-end">
                <Button size="sm" variant="success" onClick={() => onApprove(request._id)} className="me-1">
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => onReject(request._id)}>
                  Reject
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center">
              No pending requests.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

const HistoryTable = ({ history, loading, error }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'FINAL APPROVED':
        return <Badge bg="success">Approved</Badge>;
      case 'Rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'FINAL APPROVED (EXPIRED)':
        return <Badge bg="warning" text="dark">Expired</Badge>;
      case 'Forwarded to HOD':
        return <Badge bg="info">Forwarded</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getFacultyViewStatus = (pass) => {
    const now = new Date();
    const validTo = new Date(pass.date_valid_to);

    if (pass.hod_status === 'APPROVED') {
      if (validTo < now) {
        return 'FINAL APPROVED (EXPIRED)';
      }
      return 'FINAL APPROVED';
    }
    if (pass.hod_status === 'REJECTED' || pass.faculty_status === 'REJECTED') {
      return 'REJECTED';
    }
    if (pass.faculty_status === 'APPROVED' && pass.hod_approver_id) {
      return 'Forwarded to HOD';
    }
    return pass.faculty_status; // Should be PENDING
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Reason</th>
          <th>Approved By</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {history.length > 0 ? (
          history.map((item) => (
            <tr key={item._id}>
              <td>{item.student_id?.fullName}</td>
              <td>{new Date(item.date_valid_from).toLocaleString()}</td>
              <td>{item.date_valid_to ? new Date(item.date_valid_to).toLocaleString() : 'N/A'}</td>
              <td>{item.reason}</td>
              <td>{getApproverDisplay(item)}</td>
              <td>{getStatusBadge(getFacultyViewStatus(item))}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center">
              No history found.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

const FacultyGatePass = () => {
  const [key, setKey] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchGatePassData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = user?.role === 'HOD' ? 'hod' : 'faculty';
      const [pendingRes, historyRes] = await Promise.all([
        apiClient.get(`/api/gatepass/${endpoint}/pending`),
        apiClient.get(`/api/gatepass/${endpoint}/history`),
      ]);
      
      setPendingRequests(pendingRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      setError('Failed to fetch gate pass data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGatePassData();
    }
  }, [fetchGatePassData, user]);

  const handleApprove = async (id) => {
    try {
      const endpoint = user?.role === 'HOD' ? 'hod' : 'faculty';
      await apiClient.put(`/api/gatepass/${endpoint}/approve/${id}`);
      fetchGatePassData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request.');
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const endpoint = user?.role === 'HOD' ? 'hod' : 'faculty';
      await apiClient.put(`/api/gatepass/${endpoint}/reject/${id}`);
      fetchGatePassData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
      console.error(err);
    }
  };

  return (
    <Container fluid className="py-4">
      <StatsFetcher featureType="gatepass" user={user} />
      <h1 className="h4 mb-4">Gate Pass Management</h1>
      <Card>
        <Card.Header>
          <Tabs id="gate-pass-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="card-header-tabs">
            <Tab eventKey="pending" title="Pending Requests" />
            <Tab eventKey="history" title="Approval History" />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {key === 'pending' && (
            <PendingRequests
              pendingRequests={pendingRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
              error={error}
            />
          )}
          {key === 'history' && <HistoryTable history={history} loading={loading} error={error} />}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FacultyGatePass;