import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import useToastService from '../hooks/useToastService';

const LateEntryModal = ({ entry, visible, onClose, onSave, isSaving }) => {
  const [remarks, setRemarks] = useState('');
  const toast = useToastService();

  useEffect(() => {
    if (entry) {
      setRemarks(entry.remarks || '');
    }
  }, [entry]);

  const handleSave = (status) => {
    if (!entry) return;
    if (status === 'Declined' && !remarks.trim()) {
      toast.error('Remarks are required when declining a request.');
      return;
    }
    onSave(entry._id, status, remarks);
  };

  if (!entry) {
    return null;
  }

  return (
    <Modal show={visible} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Late Entry Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup variant="flush">
          <ListGroup.Item><strong>Student ID:</strong> {entry.student?.studentId}</ListGroup.Item>
          <ListGroup.Item><strong>Name:</strong> {entry.student?.fullName}</ListGroup.Item>
          <ListGroup.Item><strong>Department:</strong> {entry.student?.department}</ListGroup.Item>
          <ListGroup.Item><strong>Entry Time:</strong> {new Date(entry.entryTime).toLocaleString()}</ListGroup.Item>
          <ListGroup.Item><strong>Reason:</strong> {entry.reason}</ListGroup.Item>
        </ListGroup>
        <Form.Group className="mt-3" controlId="facultyRemarks">
          <Form.Label>Faculty Remarks</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add optional remarks before approving or denying (required for declining)"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Close
        </Button>
        <Button
          variant="danger"
          disabled={isSaving}
          onClick={() => handleSave('Declined')}
        >
          Deny
        </Button>
        <Button
          variant="primary"
          disabled={isSaving}
          onClick={() => handleSave('Approved')}
        >
          Approve
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LateEntryModal;
