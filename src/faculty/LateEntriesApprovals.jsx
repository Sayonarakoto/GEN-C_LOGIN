import React, { useState, useEffect } from 'react';
import { Layout, Card, Button as AntdButton, Form, Input, message, Avatar, Tag, Modal } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { updateLatecomerStatus } from '../api/latecomerService';
import api from '../api/client';
// import './Dashboard.css'; // External CSS file for custom styles - no longer needed

const { TextArea } = Input;
const { Content } = Layout;

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
      message.success('Status updated successfully');
      setRequests(requests.filter((req) => req._id !== id));
    } catch (error) {
      console.error('Failed to update status', error);
      message.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModalSave = async (status) => {
    if (!selected) return;
    console.log(`Attempting to ${status} entry from modal with ID:`, selected._id);
    setIsSaving(true);
    try {
      await updateLatecomerStatus(selected._id, status, remarks);
      message.success('Status updated successfully');
      setRequests(requests.filter((req) => req._id !== selected._id));
      handleClose();
    } catch (error) {
      console.error('Failed to update status', error);
      message.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Content style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', color: 'var(--dark-gray)' }}>Pending Requests</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'var(--error-red)' }}>Error: {error}</p>}
      <div className="pending-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {requests.map((req) => (
          <Card key={req._id} className="glass-container" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar src={req.student?.photo} size={56} style={{ marginRight: '16px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, color: 'var(--dark-gray)' }}>{req.student?.name}</h5>
                  <Tag color="orange">Pending</Tag>
                </div>
                <div style={{ color: 'var(--dark-gray)', fontSize: '0.85em' }}>ID: {req.student?.studentId}</div>
                <div style={{ color: 'var(--dark-gray)', marginBottom: '4px' }}><strong>Reason:</strong> {req.reason}</div>
                <div style={{ color: 'var(--dark-gray)', fontSize: '0.75em' }}>{new Date(req.createdAt).toLocaleString()}</div>
              </div>
              <AntdButton type="link" icon={<EyeOutlined />} onClick={() => handleView(req)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <AntdButton type="danger" icon={<CloseOutlined />} onClick={() => handleQuickAction(req._id, 'Declined')} style={{ flex: 1 }}>Deny</AntdButton>
              <AntdButton type="primary" icon={<CheckOutlined />} onClick={() => handleQuickAction(req._id, 'Approved')} style={{ flex: 1 }}>Approve</AntdButton>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal for detailed request */}
      <Modal
        open={showModal}
        footer={null}
        onCancel={handleClose}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AntdButton type="link" icon={<ArrowLeftOutlined />} onClick={handleClose} />
            <span style={{ flex: 1, textAlign: 'center' }}>Late Entry Request</span>
          </div>
        }
        width={400}
      >
        {selected && (
          <div>
            <section style={{ marginBottom: '24px' }}>
              <h5 style={{ marginBottom: '16px', color: 'var(--dark-gray)' }}>Student Information</h5>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Avatar src={selected.student?.photo} size={64} style={{ marginRight: '16px' }} />
                <div>
                  <strong style={{ color: 'var(--dark-gray)' }}>{selected.student?.name}</strong>
                  <div style={{ color: 'var(--dark-gray)' }}>ID: {selected.student?.studentId}</div>
                </div>
              </div>
            </section>
            <section style={{ marginBottom: '24px' }}>
              <h5 style={{ marginBottom: '16px', color: 'var(--dark-gray)' }}>Entry Details</h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--dark-gray)' }}>Date & Time</span>
                <span style={{ color: 'var(--dark-gray)' }}>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--dark-gray)' }}>Reason</span>
                <div style={{ color: 'var(--dark-gray)' }}>{selected.reason}</div>
              </div>
            </section>
            <section style={{ marginBottom: '24px' }}>
              <h5 style={{ marginBottom: '16px', color: 'var(--dark-gray)' }}>Remarks</h5>
              <TextArea 
                rows={4} 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks (optional)"
              />
            </section>
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <AntdButton type="danger" onClick={() => handleModalSave('Declined')} loading={isSaving} style={{ flex: 1 }}>Deny</AntdButton>
              <AntdButton type="primary" onClick={() => handleModalSave('Approved')} loading={isSaving} style={{ flex: 1 }}>Approve</AntdButton>
            </div>
          </div>
        )}
      </Modal>
    </Content>
  );
}

