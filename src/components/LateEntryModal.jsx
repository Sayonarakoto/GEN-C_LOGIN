import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Descriptions, message } from 'antd';

const { TextArea } = Input;

const LateEntryModal = ({ entry, visible, onClose, onSave, isSaving }) => {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (entry) {
      setRemarks(entry.remarks || '');
    }
  }, [entry]);

  const handleSave = (status) => {
    if (!entry) return;
    onSave(entry._id, status, remarks);
  };

  if (!entry) {
    return null;
  }

  return (
    <Modal
      title="Late Entry Details"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} disabled={isSaving}>
          Close
        </Button>,
        <Button
          key="deny"
          type="primary"
          danger
          loading={isSaving}
          onClick={() => handleSave('Declined')}
        >
          Deny
        </Button>,
        <Button
          key="approve"
          type="primary"
          loading={isSaving}
          onClick={() => handleSave('Approved')}
        >
          Approve
        </Button>,
      ]}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Student ID">{entry.student?.studentId}</Descriptions.Item>
        <Descriptions.Item label="Name">{entry.student?.fullName}</Descriptions.Item>
        <Descriptions.Item label="Department">{entry.student?.department}</Descriptions.Item>
        <Descriptions.Item label="Entry Time">
          {new Date(entry.entryTime).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Reason">{entry.reason}</Descriptions.Item>
      </Descriptions>
      <Form layout="vertical" style={{ marginTop: '20px' }}>
        <Form.Item label="Faculty Remarks">
          <TextArea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add optional remarks before approving or denying"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LateEntryModal;
