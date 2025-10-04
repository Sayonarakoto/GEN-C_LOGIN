import React, { useState, useEffect, useCallback } from 'react';
import { Table, Spinner, Button, Card, Badge } from 'react-bootstrap';
import dayjs from 'dayjs';
import api from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import useToastService from '../hooks/useToastService';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import StudentLateEntryForm from './StudentLateEntryForm';

export default function StudentLateEntry() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const toast = useToastService();
  const [formLoading, setFormLoading] = useState(false);
  const [lateEntries, setLateEntries] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [entryToEdit, setEntryToEdit] = useState(null);
  const isEditMode = !!requestId;

  const themeColors = {
    txt: theme === 'dark' ? 'var(--text-primary)' : '#212529',
  };

  const fetchLateEntries = useCallback(async () => {
    if (!user || !user.id) return;
    setTableLoading(true);
    try {
      const res = await api.get('/api/latecomers/mine');
      setLateEntries(res.data.entries || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch your late entries');
    } finally {
      setTableLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchLateEntries();
  }, [fetchLateEntries]);

  useEffect(() => {
    if (isEditMode) {
      const entry = lateEntries.find(e => e._id === requestId);
      if (entry) {
        setEntryToEdit(entry);
      } else if (!tableLoading) {
        api.get(`/api/latecomers/${requestId}`)
          .then(res => setEntryToEdit(res.data.lateEntry))
          .catch(() => toast.error('Could not find the requested entry.'));
      }
    } else {
      setEntryToEdit(null);
    }
  }, [isEditMode, requestId, lateEntries, tableLoading, toast]);

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (!formData.facultyId) {
        toast.error("Please select a faculty member.");
        setFormLoading(false);
        return;
      }

      const payload = {
        ...formData,
        date: dayjs(formData.date).toISOString(),
        status: isEditMode ? 'Resubmitted' : 'Pending',
      };

      const res = isEditMode
        ? await api.put(`/api/latecomers/${requestId}`, payload)
        : await api.post('/api/latecomers', payload);

      if (res.data.success) {
        toast.success(res.data.message || (isEditMode ? 'Resubmitted successfully' : 'Submitted successfully'));
        fetchLateEntries();
        if (isEditMode) {
          navigate('/student/late-entry');
        }
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Resubmitted': return 'info';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const columns = [
    { header: 'Submitted On', accessor: 'createdAt', formatter: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { header: 'Last Action', accessor: 'updatedAt', formatter: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Faculty', accessor: 'facultyId', formatter: (faculty) => faculty ? faculty.fullName : 'N/A' },
    {
      header: 'HOD Status',
      accessor: 'HODStatus',
      formatter: (status) => status ? <Badge bg={getStatusBadge(status)}>{status}</Badge> : 'N/A'
    },
    {
      header: 'Status',
      accessor: 'status',
      formatter: (status) => <Badge bg={getStatusBadge(status)}>{status}</Badge>
    },
    {
      header: 'Actions',
      accessor: '_id',
      formatter: (id, row) => (
        (row.status === 'Rejected') && (
          <Button onClick={() => navigate(`/student/submit-entry/${id}`)} variant="primary" size="sm">Edit/Resubmit</Button>
        )
      )
    }
  ];

  // Helper to get nested properties for table cells
  const getNestedValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

  return (
    <div>
      <Card className="shadow-sm mb-4" border={theme === 'dark' ? 'secondary' : 'light'}>
        <Card.Body>
          {isEditMode ? (
            entryToEdit ? 
            <StudentLateEntryForm entryData={entryToEdit} onSubmit={handleSubmit} loading={formLoading} /> : 
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <StudentLateEntryForm onSubmit={handleSubmit} loading={formLoading} />
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm" border={theme === 'dark' ? 'secondary' : 'light'}>
        <Card.Body>
          <h4 className="mb-3" style={{ color: themeColors.txt }}>My Late Entries</h4>
          <Table striped bordered hover responsive variant={theme}>
            <thead>
              <tr>
                {columns.map((col, idx) => <th key={idx}>{col.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan={columns.length} className="text-center"><Spinner animation="border" size="sm" /> Loading...</td></tr>
              ) : lateEntries.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center">No late entries found.</td></tr>
              ) : (
                lateEntries.map((entry) => (
                  <tr key={entry._id}>
                    {columns.map((col) => (
                      <td key={col.accessor}>
                        {col.formatter ? col.formatter(getNestedValue(entry, col.accessor), entry) : getNestedValue(entry, col.accessor)}
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
}
