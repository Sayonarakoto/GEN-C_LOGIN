/**
 * @file StudentLateEntry.jsx
 * @description Student Late Entry management page.
 * Demonstrates pilot migration integrating common FormField, Dropdown, DataTable, FilterBar, and Dialog.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import dayjs from 'dayjs';
import api from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';
import useToastService from '../hooks/useToastService';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import StudentLateEntryForm from './StudentLateEntryForm';
import { DataTable, FilterBar, Dialog } from '../components/common';

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

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog state for viewing details
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState(null);

  const themeColors = {
    txt: theme === 'dark' ? 'var(--text-primary)' : '#212529',
  };

  const fetchLateEntries = useCallback(async () => {
    if (!user || !user.id) return;
    setTableLoading(true);
    try {
      const res = await api.get('/latecomers/mine');
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
      const entry = lateEntries.find((e) => e._id === requestId);
      if (entry) {
        setEntryToEdit(entry);
      } else if (!tableLoading) {
        api.get(`/api/latecomers/${requestId}`)
          .then((res) => setEntryToEdit(res.data.lateEntry))
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
        toast.error('Please select a faculty member.');
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
        : await api.post('/latecomers', payload);

      if (res.data?.success) {
        toast.success(res.data.message || (isEditMode ? 'Resubmitted successfully' : 'Submitted successfully'));
        fetchLateEntries();
        if (isEditMode) {
          navigate('/student/late-entry');
        }
      } else {
        throw new Error(res.data?.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Resubmitted':
        return 'info';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Filtered dataset for DataTable
  const filteredEntries = useMemo(() => {
    return lateEntries.filter((item) => {
      // Search matching reason or faculty name
      const matchesSearch =
        !searchQuery.trim() ||
        (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.facultyId?.fullName && item.facultyId.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter matching
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [lateEntries, searchQuery, statusFilter]);

  // Column definitions for declarative DataTable
  const columns = [
    {
      header: 'Submitted On',
      accessor: 'createdAt',
      sortable: true,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      header: 'Last Action',
      accessor: 'updatedAt',
      sortable: true,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      sortable: true,
      render: (val) => (
        <span style={{ maxWidth: 220, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      header: 'Faculty',
      accessor: 'facultyId.fullName',
      sortable: true,
      render: (val, row) => row.facultyId?.fullName || 'N/A',
    },
    {
      header: 'HOD Status',
      accessor: 'HODStatus',
      sortable: true,
      render: (val) => (val ? <Badge bg={getStatusBadge(val)}>{val}</Badge> : 'N/A'),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val) => <Badge bg={getStatusBadge(val)}>{val}</Badge>,
    },
    {
      header: 'Actions',
      accessor: '_id',
      sortable: false,
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntryForDetails(row);
            }}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid var(--border-color, #dee2e6)',
              backgroundColor: 'var(--bg-primary, #ffffff)',
              color: 'var(--text-primary, #212529)',
              cursor: 'pointer',
            }}
          >
            View
          </button>
          {row.status === 'Rejected' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/student/submit-entry/${id}`);
              }}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--primary-color, #0d6efd)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Resubmit
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Late Entry Form Card */}
      <Card className="shadow-sm mb-4" border={theme === 'dark' ? 'secondary' : 'light'}>
        <Card.Body>
          {isEditMode ? (
            entryToEdit ? (
              <StudentLateEntryForm entryData={entryToEdit} onSubmit={handleSubmit} loading={formLoading} />
            ) : (
              <div className="text-center p-5">
                <Spinner animation="border" />
              </div>
            )
          ) : (
            <StudentLateEntryForm onSubmit={handleSubmit} loading={formLoading} />
          )}
        </Card.Body>
      </Card>

      {/* Late Entries Table Card with FilterBar and DataTable */}
      <Card className="shadow-sm" border={theme === 'dark' ? 'secondary' : 'light'}>
        <Card.Body>
          <h4 className="mb-3" style={{ color: themeColors.txt, fontWeight: 700 }}>
            My Late Entries
          </h4>

          {/* Reusable FilterBar */}
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search reason or faculty..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Resubmitted', label: 'Resubmitted' },
                ],
              },
            ]}
            onClear={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />

          {/* Reusable DataTable */}
          <DataTable
            columns={columns}
            data={filteredEntries}
            keyField="_id"
            loading={tableLoading}
            emptyMessage="No late entries found matching your criteria."
            hasFilterBar={true}
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 20]}
            onRowClick={(row) => setSelectedEntryForDetails(row)}
          />
        </Card.Body>
      </Card>

      {/* Accessible Detail Dialog */}
      <Dialog
        isOpen={Boolean(selectedEntryForDetails)}
        onClose={() => setSelectedEntryForDetails(null)}
        title="Late Entry Request Details"
        confirmText="Close"
        showCancel={false}
        onConfirm={() => setSelectedEntryForDetails(null)}
      >
        {selectedEntryForDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>Date:</strong>{' '}
              {selectedEntryForDetails.date
                ? dayjs(selectedEntryForDetails.date).format('YYYY-MM-DD')
                : 'N/A'}
            </div>
            <div>
              <strong>Faculty:</strong>{' '}
              {selectedEntryForDetails.facultyId?.fullName || 'N/A'}
            </div>
            <div>
              <strong>Reason:</strong>
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #dee2e6)',
                }}
              >
                {selectedEntryForDetails.reason || 'No description provided.'}
              </div>
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <Badge bg={getStatusBadge(selectedEntryForDetails.status)}>
                {selectedEntryForDetails.status}
              </Badge>
            </div>
            {selectedEntryForDetails.HODStatus && (
              <div>
                <strong>HOD Status:</strong>{' '}
                <Badge bg={getStatusBadge(selectedEntryForDetails.HODStatus)}>
                  {selectedEntryForDetails.HODStatus}
                </Badge>
              </div>
            )}
            <div>
              <strong>Submitted On:</strong>{' '}
              {dayjs(selectedEntryForDetails.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
