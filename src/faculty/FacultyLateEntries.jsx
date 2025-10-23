import React, { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { Row, Col } from 'react-bootstrap'; // <-- React Bootstrap Grid
import useToastService from '../hooks/useToastService';
import api from '../api/client';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import StatsFetcher from '../components/StatsFetcher';

const FacultyLateEntries = ({ currentFilter }) => {
  const toast = useToastService();
  const { user } = useAuth();
  const [lateEntries, setLateEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowEdits, setRowEdits] = useState({});
  const formRef = useRef(null);

  const [filterParams, setFilterParams] = useState({
    from: '',
    to: '',
    statusFilter: '',
  });

  const fetchLateEntries = useCallback(async (params = {}, signal) => {
    setLoading(true);
    try {
      const queryParams = { ...params };
      if (!queryParams.statusFilter) delete queryParams.statusFilter;

      if (queryParams.from) {
        queryParams.from = dayjs(queryParams.from).startOf('day').toISOString();
      }
      if (queryParams.to) {
        queryParams.to = dayjs(queryParams.to).endOf('day').toISOString();
      }

      let endpoint = '/api/latecomers/faculty/all';
      if (user?.role === 'HOD') {
        endpoint = '/api/latecomers/hod/history';
      }

      const response = await api.get(endpoint, { params: queryParams, signal });
      const entries = Array.isArray(response.data?.data) ? response.data.data : [];
      setLateEntries(entries);

      const initialEdits = {};
      entries.forEach(entry => {
        initialEdits[entry._id] = { remarks: entry.remarks || '' };
      });
      setRowEdits(initialEdits);
    } catch (error) {
      if (!axios.isCancel(error) && error.code !== 'ECONNABORTED') {
        console.error('Error fetching late entries:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch late entries');
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    const abortController = new AbortController();
    if (user?.department) {
      const effectiveFilter = { ...filterParams };
      if (!effectiveFilter.statusFilter && currentFilter) {
        effectiveFilter.statusFilter = currentFilter;
      }
      fetchLateEntries(effectiveFilter, abortController.signal);
    }
    return () => abortController.abort();
  }, [fetchLateEntries, user, currentFilter, filterParams]);

  const handleChange = (id, field, value) => {
    setRowEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleUpdate = async (id, action) => {
    setLoading(true);
    try {
      const { remarks } = rowEdits[id] || {};
      let endpoint;

      if (user.role === 'HOD') {
        endpoint = `/api/latecomers/${id}/hod-action`;
      } else if (user.role === 'faculty') {
        endpoint = `/api/latecomers/${id}/faculty-action`;
      } else {
        toast.error('Unauthorized action.');
        setLoading(false);
        return;
      }

      await api.put(endpoint, { action, remarks });
      toast.success('Updated successfully');
      fetchLateEntries(filterParams);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterParams(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchLateEntries(filterParams);
  };

  const handleClearFilters = () => {
    setFilterParams({ from: '', to: '', statusFilter: '' });
    fetchLateEntries({});
  };

  const columns = [
    { dataField: 'studentId.studentId', text: 'Student ID' },
    { dataField: 'studentId.fullName', text: 'Student Name' },
    {
      dataField: 'createdAt',
      text: 'Date',
      formatter: (cell) => cell ? new Date(cell).toLocaleString() : 'N/A',
    },
    { dataField: 'reason', text: 'Reason' },
    { dataField: 'status', text: 'Status' },
    {
      dataField: 'approvedBy',
      text: 'Approved By',
      formatter: (cell, row) => {
        // If the entry is approved and an HOD ID is present, the HOD is the final approver.
        if (row.status === 'Approved' && row.HODId) {
          // The optional chaining ?. is critical because HODId might be just an ID string instead of a populated object
          return `[HOD] ${row.HODId?.fullName || 'Details Missing'}`;
        }
        // If it's approved but no HOD, it must have been the faculty.
        if (row.status === 'Approved' && row.facultyId) {
          return row.facultyId?.fullName || 'Details Missing';
        }
        // For any other status, it's not yet approved.
        return 'N/A';
      },
    },
    {
      dataField: 'actions',
      text: 'Action',
      formatter: (row) => {
        if (user.role === 'HOD') {
          return <Typography variant="body2" color="info.main" fontWeight="bold">HOD View-Only</Typography>;
        }
        if (user.role !== 'faculty') {
          return <Typography variant="body2" color="text.secondary">View Only</Typography>;
        }

        const isActionable = ['Pending Faculty', 'Resubmitted'].includes(row.status);
        if (!isActionable) {
          return <Typography variant="body2" color="success.main" fontWeight="bold">Finalized</Typography>;
        }

        const id = row._id;
        const current = rowEdits[id] || { remarks: row.remarks || '' };
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="text"
              placeholder="Remarks for rejection"
              value={current.remarks}
              onChange={(e) => handleChange(id, 'remarks', e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              disabled={loading}
            />
            <Button variant="contained" color="success" size="small" onClick={() => handleUpdate(id, 'approve')} disabled={loading}>
              Approve
            </Button>
            <Button variant="contained" color="error" size="small" onClick={() => handleUpdate(id, 'reject')} disabled={loading}>
              Reject
            </Button>
          </Stack>
        );
      }
    }
  ];

  return (
    <Box>
      <StatsFetcher featureType="lateentry" user={user} />

      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Filter Entries</Typography>

        <Box component="form" onSubmit={handleApplyFilters} ref={formRef}>
          <Row className="g-3 align-items-center justify-content-end">
            <Col xs={12} sm={6} lg={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                name="from"
                value={filterParams.from}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                name="to"
                value={filterParams.to}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel shrink>Status</InputLabel>
                <Select
                  name="statusFilter"
                  value={filterParams.statusFilter}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Col>
            <Col xs={12} lg={3} className="d-flex gap-2 justify-content-end">
              <Button variant="contained" type="submit" disabled={loading}>
                Filter
              </Button>
              <Button variant="outlined" onClick={handleClearFilters} disabled={loading}>
                Clear
              </Button>
            </Col>
          </Row>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, p: 3 }}>
        <Typography variant="h6" gutterBottom>All Late Entries</Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="late entries table">
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell key={idx} sx={{ fontWeight: 'bold' }}>{col.text}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                  </TableCell>
                </TableRow>
              ) : lateEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">No late entries found.</TableCell>
                </TableRow>
              ) : (
                lateEntries.map((entry) => (
                  <TableRow key={entry._id} hover>
                    {columns.map((col, idx) => (
                      <TableCell key={idx}>
                        {col.dataField === 'actions' ? (
                          col.formatter(entry)
                        ) : col.dataField.includes('.') ? (
                          col.dataField.split('.').reduce((o, i) => o?.[i], entry) ?? 'N/A'
                        ) : col.formatter ? (
                          col.formatter(entry[col.dataField], entry)
                        ) : (
                          entry[col.dataField] ?? 'N/A'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default FacultyLateEntries;
