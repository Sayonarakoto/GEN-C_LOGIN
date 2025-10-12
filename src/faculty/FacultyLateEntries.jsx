import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Grid,
  CircularProgress,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
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
      if (queryParams.statusFilter === '') {
        delete queryParams.statusFilter;
      }

      let endpoint = '/api/latecomers/faculty/all'; // Default for faculty
      if (user.role === 'HOD') {
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
      fetchLateEntries({ ...filterParams, statusFilter: currentFilter }, abortController.signal);
    }

    return () => {
      abortController.abort();
    };
  }, [fetchLateEntries, user, currentFilter, filterParams]);

  const handleChange = (id, field, value) => {
    setRowEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
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
        return toast.error('Unauthorized action.');
      }
      
      await api.put(endpoint, { 
          action: action, 
          remarks 
      });
      
      toast.success('Updated successfully');
      fetchLateEntries(filterParams);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    setFilterParams({
      ...filterParams,
      [event.target.name]: event.target.value,
    });
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    fetchLateEntries(filterParams);
  };

  const handleClearFilters = () => {
    setFilterParams({
      from: '',
      to: '',
      statusFilter: '',
    });
    fetchLateEntries({});
  };

  const columns = [
    { dataField: 'studentId.studentId', text: 'Student ID' },
    { dataField: 'studentId.fullName', text: 'Student Name' },
    { dataField: 'studentId.department', text: 'Department' },
    { dataField: 'createdAt', text: 'Date', formatter: (cell) => cell ? new Date(cell).toLocaleString() : 'N/A' },
    { dataField: 'reason', text: 'Reason' },
    { dataField: 'status', text: 'Status' },
    { dataField: 'approvedBy', text: 'Approved By', formatter: (cell, row) => row.status === 'Approved' && row.facultyId?.fullName ? row.facultyId.fullName : 'N/A' },
    {
      dataField: 'actions',
      text: 'Action',
      formatter: (row) => {
        const canEdit = user.role === 'faculty';

        if (user.role === 'HOD') return <Typography variant="body2" color="info.main" fontWeight="bold">HOD View-Only</Typography>;
        if (!canEdit) return <Typography variant="body2" color="text.secondary">View Only</Typography>;
        
        const isActionable = row.status === 'Pending Faculty' || row.status === 'Resubmitted';

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
            />
            <Button variant="contained" color="success" size="small" onClick={() => handleUpdate(id, 'approve')}>Approve</Button>
            <Button variant="contained" color="error" size="small" onClick={() => handleUpdate(id, 'reject')}>Reject</Button>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <StatsFetcher featureType="lateentry" />
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Filter Entries</Typography>
        <Box component="form" onSubmit={handleApplyFilters} ref={formRef}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                name="from"
                value={filterParams.from}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                name="to"
                value={filterParams.to}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="statusFilter"
                  value={filterParams.statusFilter}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="Pending Faculty">Pending Faculty</MenuItem>
                  <MenuItem value="Pending HOD">Pending HOD</MenuItem>
                  <MenuItem value="Resubmitted">Resubmitted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Button variant="contained" type="submit" sx={{ mr: 1 }}>Filter</Button>
              <Button variant="outlined" onClick={handleClearFilters}>Clear</Button>
            </Grid>
          </Grid>
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
                          col.dataField.split('.').reduce((o, i) => o?.[i], entry)
                        ) : col.formatter ? (
                          col.formatter(entry[col.dataField], entry)
                        ) : (
                          entry[col.dataField]
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
