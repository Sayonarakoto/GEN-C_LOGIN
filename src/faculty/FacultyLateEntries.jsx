import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import useToastService from '../hooks/useToastService';
import api from '../api/client';
import axios from 'axios';

const FacultyLateEntries = () => {
  const toast = useToastService();
  const [lateEntries, setLateEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowEdits, setRowEdits] = useState({});
  const formRef = useRef(null); // Ref for the form

  const fetchLateEntries = useCallback(async (params = {}, signal) => {
    setLoading(true);
    try {
      const response = await api.get('/api/latecomers', { params, signal });
      const entries = response.data || [];
      setLateEntries(entries);
      const initialEdits = {};
      entries.forEach(entry => {
        initialEdits[entry._id] = { status: entry.status, remarks: entry.remarks || '' };
      });
      setRowEdits(initialEdits);
    } catch (error) {
      if (axios.isCancel(error) || error.code === 'ECONNABORTED') {
        console.log('Request cancelled:', error.message);
      } else {
        console.error('Error fetching late entries:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch late entries');
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, setLateEntries, setRowEdits, toast]); // Add toast to dependencies

  useEffect(() => {
    const abortController = new AbortController();
    fetchLateEntries({ status: 'Pending,Resubmitted' }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchLateEntries]); 

  const onFinish = (event) => {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(formRef.current); // Get form data
    const values = Object.fromEntries(formData.entries());
    fetchLateEntries(values);
  };

  const handleChange = (id, field, value) => {
    setRowEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleUpdate = async (id) => {
    try {
      const { status, remarks } = rowEdits[id] || {};
      if (!status) return toast.warning('Please select a status');
      
      // Capture current filter values before async operation
      const formData = new FormData(formRef.current);
      const currentFilterValues = Object.fromEntries(formData.entries());
      
      await api.put(`/api/latecomers/${id}/status`, { status, remarks });
      toast.success('Updated successfully');
      fetchLateEntries(currentFilterValues);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleClearFilters = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    fetchLateEntries({ status: 'Pending,Resubmitted' });
  };

  const columns = [
    { dataField: 'studentId.studentId', text: 'Student ID' },
    { dataField: 'studentId.fullName', text: 'Student Name' },
    { dataField: 'studentId.department', text: 'Department' },
    { dataField: 'date', text: 'Recorded At', formatter: (cell) => new Date(cell).toLocaleString() },
    { dataField: 'reason', text: 'Reason' },
    { dataField: 'gate', text: 'Gate' },
    { dataField: 'status', text: 'Status' },
    { dataField: 'remarks', text: 'Remarks' },
    {
      dataField: 'actions',
      text: 'Action',
      formatter: (cellContent, row) => {
        const id = row._id;
        const current = rowEdits[id] || { status: row.status, remarks: row.remarks };
        return (
          <div className="d-flex gap-2 align-items-center">
            <Form.Select
              value={current.status}
              onChange={(e) => handleChange(id, 'status', e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="Pending" disabled>Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Form.Select>
            <Form.Control
              type="text"
              placeholder="Remarks"
              value={current.remarks}
              onChange={(e) => handleChange(id, 'remarks', e.target.value)}
              style={{ flex: 1 }}
            />
            <Button variant="primary" size="sm" onClick={() => handleUpdate(id)}>Save</Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <Card className="mb-4" style={{ background: 'var(--card-bg)', borderRadius: '8px' }}>
        <Card.Body>
          <h5 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Filter Entries</h5>
          <Form ref={formRef} onSubmit={onFinish}>
            <Row className="g-3">
              <Col xs={12} sm={6} md={3}>
                <Form.Group controlId="filterDepartment">
                  <Form.Label>Department</Form.Label>
                  <Form.Control name="department" type="text" placeholder="Department" />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group controlId="filterFromDate">
                  <Form.Label>From Date</Form.Label>
                  <Form.Control name="from" type="date" />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group controlId="filterToDate">
                  <Form.Label>To Date</Form.Label>
                  <Form.Control name="to" type="date" />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group controlId="filterStatus">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status">
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Resubmitted">Resubmitted</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} className="text-end">
                <Button variant="primary" type="submit" className="me-2">Filter</Button>
                <Button variant="secondary" onClick={handleClearFilters}>Clear</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px' }}>
        <Card.Body>
          <h5 style={{ color: 'var(--text-primary)' }}>All Late Entries</h5>
          <Table striped bordered hover responsive className="dark-theme-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col.text}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center">
                    <Spinner animation="border" size="sm" /> Loading...
                  </td>
                </tr>
              ) : lateEntries.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center">No late entries found.</td>
                </tr>
              ) : (
                lateEntries.map((entry) => (
                  <tr key={entry._id}>
                    {columns.map((col, idx) => (
                      <td key={idx}>
                        {col.dataField === 'actions' ? (
                          col.formatter(null, entry) // Pass row data to formatter
                        ) : col.dataField.includes('.') ? (
                          col.dataField.split('.').reduce((o, i) => o[i], entry)
                        ) : col.formatter ? (
                          col.formatter(entry[col.dataField])
                        ) : (
                          entry[col.dataField]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FacultyLateEntries;
