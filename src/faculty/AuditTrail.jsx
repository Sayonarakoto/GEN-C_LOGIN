import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
  TablePagination,
  Container,
  Grid,
  Card,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import apiClient from '../api/client';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    studentId: '',
    eventType: '',
    startDate: null,
    endDate: null,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/audit/department-logs');
      setLogs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError('Failed to load audit logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFilters((prev) => ({ ...prev, [name]: date ? dayjs(date).format('YYYY-MM-DD') : null }));
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/audit/logs/export', { params: filters, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export audit logs:", err);
      setError('Failed to export audit logs.');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLogs = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Audit Trail
        </Typography>

        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>Recent Department Activity</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Grid container spacing={3}>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <Grid item xs={12} sm={6} md={4} key={log._id}>
                    <Card sx={{ p: 2, height: '100%' }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="h6" component="div">
                        {log.event_type}
                      </Typography>
                      <Typography sx={{ mb: 1.5 }} color="text.secondary">
                        {log.pass_id?.pass_type || 'N/A'} - {log.pass_id?.status || 'N/A'}
                      </Typography>
                      <Typography variant="body1">Actor: {log.actor_id?.fullName || 'N/A'}</Typography>
                      <Typography variant="body2">Email: {log.actor_id?.email || 'N/A'}</Typography>
                      <Typography variant="body2">Faculty ID: {log.actor_id?.employeeId || 'N/A'}</Typography>
                      <Typography variant="body2">Details: {JSON.stringify(log.event_details)}</Typography>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography align="center">No audit logs found.</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default AuditTrail;
