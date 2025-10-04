import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import useToastService from '../hooks/useToastService';

import { useAuth } from '../hooks/useAuth';

const LateEntryModal = ({ entry, visible, onClose, onSave, isSaving }) => {
  const [remarks, setRemarks] = useState('');
  const toast = useToastService();
  const { user } = useAuth(); // Get user from AuthContext

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

  const canApprove = user.role === 'faculty';

  return (
    <Modal show={visible} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Late Entry Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup variant="flush">
          <ListGroup.Item><strong>Student ID:</strong> {entry.studentId?.studentId || entry.student?.studentId}</ListGroup.Item>
          <ListGroup.Item><strong>Name:</strong> {entry.studentId?.fullName || entry.student?.fullName}</ListGroup.Item>
          <ListGroup.Item><strong>Department:</strong> {entry.studentId?.department || entry.student?.department}</ListGroup.Item>
          <ListGroup.Item>
            <strong>Entry Time:</strong>{' '}
            {
              (() => {
                const dateValue = entry.createdAt || entry.date || entry.lastActionAt || entry.entryTime;
                if (dateValue) {
                  const dateObj = new Date(dateValue);
                  return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleString();
                }
                return 'N/A';
              })()
            }
          </ListGroup.Item>
          <ListGroup.Item><strong>Reason:</strong> {entry.reason}</ListGroup.Item>
        </ListGroup>
        {entry.status === 'Approved' && entry.facultyId?.fullName && (
            <ListGroup.Item><strong>Approved By:</strong> {entry.facultyId.fullName}</ListGroup.Item>
          )}
        <Form.Group className="mt-3" controlId="facultyRemarks">
          <Form.Label>Faculty Remarks</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add optional remarks before approving or denying (required for declining)"
            readOnly={!canApprove} // Make remarks read-only for HOD
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Close
        </Button>
        {canApprove && (
          <>
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
          </>
        )}
        {!canApprove && user.role === 'HOD' && (
          <span className="text-muted">View Only Access</span>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default LateEntryModal;
