import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Badge } from 'react-bootstrap';
import apiClient from '../api/client';

// --- Pending Requests Table ---
const PendingRequests = ({ pendingRequests, onApprove, onReject, loading, error }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Student Name</TableCell>
            <TableCell>Exit Time</TableCell>
            <TableCell>Return Time</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>{request.student_id?.fullName}</TableCell>
                <TableCell>{new Date(request.date_valid_from).toLocaleTimeString()}</TableCell>
                <TableCell>{request.date_valid_to ? new Date(request.date_valid_to).toLocaleTimeString() : 'N/A'}</TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="contained" color="success" onClick={() => onApprove(request._id)} sx={{ mr: 1 }}>
                    Approve
                  </Button>
                  <Button size="small" variant="contained" color="error" onClick={() => onReject(request._id)}>
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No pending requests.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// --- History Table ---
const HistoryTable = ({ history, loading, error }) => {
    const getStatusBadge = (status) => {
        switch (status) {
          case 'Approved':
            return <Badge bg="success">Approved</Badge>;
          case 'Rejected':
            return <Badge bg="danger">Rejected</Badge>;
          default:
            return <Badge bg="secondary">{status}</Badge>;
        }
      };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Student Name</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.length > 0 ? (
            history.map((item) => (
              <tr key={item._id}>
                <td>{item.student_id?.fullName}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{getStatusBadge(item.status)}</td>
              </tr>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} align="center">
                No history found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// --- Main Faculty Gate Pass Component ---
const FacultyGatePass = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGatePassData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const pendingRes = await apiClient.get('/api/gatepass/faculty/pending');
      const historyRes = await apiClient.get('/api/gatepass/faculty/history');
      setPendingRequests(pendingRes.data.data);
      setHistory(historyRes.data.data);
    } catch (err) {
      setError('Failed to fetch gate pass data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGatePassData();
  }, [fetchGatePassData]);

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/api/gatepass/faculty/approve/${id}`);
      fetchGatePassData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request.');
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/api/gatepass/faculty/reject/${id}`); // Corrected endpoint
      fetchGatePassData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
      console.error(err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gate Pass Management
      </Typography>
      <Paper elevation={2}>
        <Tabs value={tabIndex} onChange={handleTabChange} centered>
          <Tab label="Pending Requests" />
          <Tab label="Approval History" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabIndex === 0 && (
            <PendingRequests
              pendingRequests={pendingRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
              error={error}
            />
          )}
          {tabIndex === 1 && <HistoryTable history={history} loading={loading} error={error} />}
        </Box>
      </Paper>
    </Container>
  );
};

export default FacultyGatePass;