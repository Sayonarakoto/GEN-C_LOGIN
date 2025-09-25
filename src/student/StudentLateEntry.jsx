import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Button, Table, Spinner } from 'react-bootstrap';
import dayjs from 'dayjs';
import api from '../api/client';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import useToastService from '../hooks/useToastService';

function StudentLateEntryContent() {
  const toast = useToastService();
  const [loading, setLoading] = useState(false);
  const [lateEntries, setLateEntries] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = searchParams.get('action') === 'edit';

  const [reason, setReason] = useState('');
  const [entryTime, setEntryTime] = useState('');

  const formRef = useRef(null);

  const fetchLateEntries = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await api.get('/api/latecomers/mine');
      setLateEntries(res.data.entries || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch late entries');
    } finally {
      setTableLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLateEntries();
  }, [fetchLateEntries]);

  useEffect(() => {
    if (isEditMode && requestId) {
      const fetchRequestData = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/latecomers/${requestId}`);
          const requestData = response.data.lateEntry; // Access lateEntry property
          setReason(requestData.reason);
          setEntryTime(dayjs(requestData.date).format('YYYY-MM-DDTHH:mm')); // Format for datetime-local input
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to load request for editing');
          navigate('/student/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchRequestData();
    }
  }, [isEditMode, requestId, toast, navigate, setLoading, setReason, setEntryTime]);

  const onFinish = async (event) => {
    event.preventDefault();

    // Add form validation before proceeding
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    try {
      setLoading(true);
      const payload = {
        reason: reason,
        date: entryTime ? dayjs(entryTime).toISOString() : undefined,
        status: isEditMode ? 'Resubmitted' : 'Pending',
      };

      let res;
      if (isEditMode && requestId) {
        res = await api.put(`/api/latecomers/${requestId}`, payload);
      } else {
        res = await api.post('/api/latecomers', payload);
      }

      if (res.data.success) {
        toast.success(isEditMode
          ? 'Late entry resubmitted successfully'
          : 'Late entry submitted'
        );
        setReason('');
        setEntryTime('');
        fetchLateEntries();
        if (isEditMode) {
          // Navigate back to dashboard rather than staying on the edit page
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Entry Time', accessor: 'date', formatter: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="p-3">
      <h2>{isEditMode ? 'Edit Late Entry Request' : 'Submit New Late Entry'}</h2>
      <Form ref={formRef} onSubmit={onFinish} style={{ maxWidth: 500 }}>
        <Form.Group className="mb-3" controlId="formReason">
          <Form.Label>Reason</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Describe why you were late"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formEntryTime">
          <Form.Label>Entry Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : (isEditMode ? 'Resubmit for Review' : 'Submit')}
        </Button>
      </Form>

      <h2 className="mt-4">My Late Entries</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center">
                <i className="bx bx-loader-alt bx-spin me-2"></i> Loading...
              </td>
            </tr>
          ) : lateEntries.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center">
                <i className="bx bx-info-circle me-2"></i> No late entries found.
              </td>
            </tr>
          ) : (
            lateEntries.map((entry, rowIndex) => (
              <tr key={entry._id || rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.formatter ? col.formatter(entry[col.accessor]) : entry[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default function StudentLateEntry() {
  return (
    <StudentLateEntryContent />
  );
}
