import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { Modal, Avatar, Input, Button as AntdButton } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { updateLatecomerStatus } from '../api/latecomerService';
import api from '../api/client';
import './Dashboard.css'; // External CSS file for custom styles

const { TextArea } = Input;

export default function LateEntriesApprovals() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/latecomers/pending');
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pending requests');
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

  const handleQuickAction = async (id, status) => {
    console.log(`Attempting to ${status} entry with ID:`, id);
    try {
      await updateLatecomerStatus(id, status, '');
      setRequests(requests.filter((req) => req._id !== id));
    } catch (error) {
      console.error('Failed to update status', error);
      // Optionally show an error toast/message to the user
    }
  };

  const handleModalSave = async (status) => {
    if (!selected) return;
    console.log(`Attempting to ${status} entry from modal with ID:`, selected._id);
    setIsSaving(true);
    try {
      await updateLatecomerStatus(selected._id, status, remarks);
      setRequests(requests.filter((req) => req._id !== selected._id));
      handleClose();
    } catch (error) {
      console.error('Failed to update status', error);
      // Optionally show an error toast/message to the user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container fluid className="dashboard-root">
      <header className="dashboard-header">
        <Row className="align-items-center p-3 shadow-sm bg-white">
          <Col xs="auto">
            <span className="icon-btn"><ArrowLeftOutlined /></span>
          </Col>
          <Col>
            <h1 className="dashboard-title">Dashboard</h1>
          </Col>
          <Col xs="auto">
            <span className="icon-btn"><EyeOutlined /></span>
          </Col>
        </Row>
      </header>

      <main className="dashboard-main py-4">
        <h2 className="section-title mb-4">Pending Requests</h2>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        <div className="pending-list">
          {requests.map((req) => (
            <Card key={req._id} className="mb-4 shadow pending-card">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs="auto">
                    <Avatar src={req.student?.photo} size={56} />
                  </Col>
                  <Col>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{req.student?.name}</h5>
                      <span className="badge badge-warning">Pending</span>
                    </div>
                    <div className="text-muted small mb-1">ID: {req.student?.studentId}</div>
                    <div className="mb-1"><strong>Reason:</strong> {req.reason}</div>
                    <div className="small text-secondary">{new Date(req.createdAt).toLocaleString()}</div>
                  </Col>
                  <Col xs="auto">
                    <Button variant="link" className="view-btn" onClick={() => handleView(req)}>
                      <EyeOutlined />
                    </Button>
                  </Col>
                </Row>
                <Row className="mt-3 justify-content-between">
                  <Col xs={6}>
                    <Button variant="danger" className="w-100" onClick={() => handleQuickAction(req._id, 'Declined')}>
                      <CloseOutlined /> Deny
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button variant="success" className="w-100" onClick={() => handleQuickAction(req._id, 'Approved')}>
                      <CheckOutlined /> Approve
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      </main>

      {/* Modal for detailed request */}
      <Modal
        visible={showModal}
        footer={null}
        onCancel={handleClose}
        centered
        title={
          <div className="d-flex align-items-center">
            <AntdButton type="link" icon={<ArrowLeftOutlined />} onClick={handleClose} />
            <span style={{ flex: 1, textAlign: 'center' }}>Late Entry Request</span>
          </div>
        }
        width={400}
      >
        {selected && (
          <div>
            <section>
              <h5 className="mb-3">Student Information</h5>
              <div className="d-flex align-items-center mb-3">
                <Avatar src={selected.student?.photo} size={64} />
                <div className="ml-3">
                  <strong>{selected.student?.name}</strong>
                  <div className="text-muted">ID: {selected.student?.studentId}</div>
                </div>
              </div>
            </section>
            <section>
              <h5 className="mb-3">Entry Details</h5>
              <div className="mb-2 d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Date & Time</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted">Reason</span>
                <div>{selected.reason}</div>
              </div>
            </section>
            <section className='mt-3'>
              <h5 className="mb-3">Remarks</h5>
              <TextArea 
                rows={4} 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks (optional)"
              />
            </section>
            <div className="d-flex gap-3 pt-4">
              <AntdButton type="primary" danger className="flex-fill" onClick={() => handleModalSave('Declined')} loading={isSaving}>Deny</AntdButton>
              <AntdButton type="primary" className="flex-fill" onClick={() => handleModalSave('Approved')} loading={isSaving}>Approve</AntdButton>
            </div>
          </div>
        )}
      </Modal>
    </Container>
  );
}
