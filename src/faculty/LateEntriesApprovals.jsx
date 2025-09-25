import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Modal, Badge, Container } from 'react-bootstrap';
import { VisibilityOutlined, CheckOutlined, CloseOutlined, ArrowBack } from '@mui/icons-material';
import Avatar from '@mui/material/Avatar';
import { updateLatecomerStatus } from '../api/latecomerService';
import api from '../api/client';
import useToastService from '../hooks/useToastService';



// Helper to determine badge color based on status
const statusColors = {
  Pending: 'warning',
  Resubmitted: 'info',
};

export default function LateEntriesApprovals() {
  const toast = useToastService();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchActionableRequests();
  }, []);

  const fetchActionableRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/latecomers?status=Pending,Resubmitted');
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch actionable requests');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (req) => {
    setSelected(req);
    setRemarks(req.remarks || '');
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelected(null);
    setRemarks('');
  };

  const handleQuickApprove = async (id) => {
    try {
      await updateLatecomerStatus(id, 'Approved', '');
      toast.success('Request approved successfully');
      setRequests(requests.filter((req) => req._id !== id));
    } catch (error) {
      // Log to monitoring service instead of console
      toast.error(error.response?.data?.message || 'Failed to approve status');
    }
  };

  const handleModalSave = async (status) => {
    if (!selected) return;

    if (status === 'Rejected' && !remarks.trim()) {
      toast.error('A reason is required to reject a request.');
      return;
    }

    console.log(`Attempting to ${status} entry from modal with ID:`, selected._id);
    setIsSaving(true);
    try {
      await updateLatecomerStatus(selected._id, status, remarks);
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setRequests(requests.filter((req) => req._id !== selected._id));
      handleClose();
    } catch (error) {
      // Log to monitoring service instead of console
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container fluid className="p-3">
      <h2 className="mb-4" style={{ color: 'var(--dark-gray)' }}>Actionable Requests</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'var(--error-red)' }}>Error: {error}</p>}
      <div className="pending-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {requests.map((req) => (
          <Card key={req._id} className="glass-container" style={{ marginBottom: '16px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <Avatar sx={{ width: 56, height: 56, mr: 2 }}>{req.studentId?.fullName ? req.studentId.fullName[0] : ''}</Avatar>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0" style={{ color: 'var(--dark-gray)' }}>{req.studentId?.fullName}</h5>
                    <Badge bg={statusColors[req.status] || 'secondary'}>{req.status}</Badge>
                  </div>
                  <div style={{ color: 'var(--dark-gray)', fontSize: '0.85em' }}>ID: {req.studentId?.studentId}</div>
                  <div style={{ color: 'var(--dark-gray)', fontSize: '0.85em' }}>Department: {req.studentId?.department}</div>
                  <div style={{ color: 'var(--dark-gray)', marginBottom: '4px' }}><strong>Reason:</strong> {req.reason}</div>
                  <div style={{ color: 'var(--dark-gray)', fontSize: '0.75em' }}>{new Date(req.createdAt).toLocaleString()}</div>
                </div>
                <Button variant="link" onClick={() => handleView(req)}><VisibilityOutlined /></Button>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={() => handleQuickApprove(req._id)} className="flex-grow-1"><CheckOutlined /> Approve</Button>
                <Button variant="danger" onClick={() => handleView(req)} className="flex-grow-1"><CloseOutlined /> Deny</Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Modal for detailed request */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title className="w-100">
            <div className="d-flex align-items-center">
              <Button variant="link" onClick={handleClose} className="p-0 me-2"><ArrowBack /></Button>
              <span className="flex-grow-1 text-center">Late Entry Request</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <section className="mb-4">
                <h5 className="mb-3" style={{ color: 'var(--dark-gray)' }}>Student Information</h5>
                <div className="d-flex align-items-center mb-3">
                  <Avatar sx={{ width: 64, height: 64, mr: 2 }}>{selected.studentId?.fullName ? selected.studentId.fullName[0] : ''}</Avatar>
                  <div>
                    <strong style={{ color: 'var(--dark-gray)' }}>{selected.studentId?.fullName}</strong>
                    <div style={{ color: 'var(--dark-gray)' }}>ID: {selected.studentId?.studentId}</div>
                    <div style={{ color: 'var(--dark-gray)' }}>Department: {selected.studentId?.department}</div>
                  </div>
                </div>
              </section>
              <section className="mb-4">
                <h5 className="mb-3" style={{ color: 'var(--dark-gray)' }}>Entry Details</h5>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span style={{ color: 'var(--dark-gray)' }}>Date & Time</span>
                  <span style={{ color: 'var(--dark-gray)' }}>{new Date(selected.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--dark-gray)' }}>Reason</span>
                  <div style={{ color: 'var(--dark-gray)' }}>{selected.reason}</div>
                </div>
              </section>
              <section className="mb-4">
                <h5 className="mb-3" style={{ color: 'var(--dark-gray)' }}>Remarks / Decline Reason</h5>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks for approval or a reason for declining (required for decline)"
                />
              </section>
              <div className="d-flex gap-3 pt-3">
                <Button variant="danger" onClick={() => handleModalSave('Rejected')} disabled={isSaving} className="flex-grow-1">Deny</Button>
                <Button variant="primary" onClick={() => handleModalSave('Approved')} disabled={isSaving} className="flex-grow-1">Approve</Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}