import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Paper,
  Avatar,
  IconButton,
  Stack,
} from '@mui/material';
import { VisibilityOutlined, CheckOutlined, CloseOutlined, ArrowBack } from '@mui/icons-material';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import { useAuth } from '../hooks/useAuth';
import StatsFetcher from '../components/StatsFetcher';

// Helper to determine chip color based on status
const statusColors = {
  'Pending Faculty': { label: 'Pending Faculty', color: 'warning' },
  'Resubmitted': { label: 'Resubmitted', color: 'info' },
  'Pending HOD': { label: 'Pending HOD', color: 'error' }, // Using error for HOD pending to signify higher urgency
  'Approved': { label: 'Approved', color: 'success' },
  'Approved (Final)': { label: 'Approved (Final)', color: 'success' },
  'Rejected (Final)': { label: 'Rejected (Final)', color: 'default' }, // Default for rejected
};

export default function LateEntriesApprovals({ onActionComplete }) {
  const toast = useToastService();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchActionableRequests = useCallback(async () => {
    console.log('DEBUG: User object in fetchActionableRequests:', JSON.stringify(user, null, 2));
    if (!user || !user.id || !user.department) {
      console.log('DEBUG: User object is missing id or department. Aborting fetch.');
      setRequests([]);
      setLoading(false);
      return;
    }

    let endpoint;
    if (user.role === 'faculty') {
      endpoint = '/api/latecomers/faculty/pending';
    } else if (user.role === 'HOD') {
      endpoint = '/api/latecomers/hod/pending';
    } else {
      console.log(`DEBUG: User role '${user.role}' has no actionable requests view. Aborting fetch.`);
      setRequests([]);
      setLoading(false);
      return;
    }

    console.log(`DEBUG: Fetching actionable requests from endpoint: ${endpoint}`);

    try {
      setLoading(true);
      const response = await api.get(endpoint);
      console.log('DEBUG: Raw API response:', JSON.stringify(response.data, null, 2));

      const dataArray = Array.isArray(response.data?.data) ? response.data.data : [];
      console.log(`DEBUG: Parsed ${dataArray.length} requests from API response.`);

      setRequests(dataArray);
      setError(null);
    } catch (err) {
      setError('Failed to fetch actionable requests.');
      console.error('API Error fetching actionable requests:', err);
      toast.error('Failed to load requests. Check console for details.');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) { // Ensure user object is available before fetching
      fetchActionableRequests();
    }
  }, [user, fetchActionableRequests]);

  const handleView = (req) => {
    setSelected(req);
    if (user.role === 'HOD') {
      setRemarks(req.HODRemarks || '');
    } else {
      setRemarks(req.remarks || '');
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelected(null);
    setRemarks('');
  };

  const handleAction = async (id, action, remarks = '') => {
    setIsSaving(true);
    try {
      let endpoint;
      if (user.role === 'HOD') {
        endpoint = `/api/latecomers/${id}/hod-action`;
      } else if (user.role === 'faculty') {
        endpoint = `/api/latecomers/${id}/faculty-action`;
      } else {
        toast.error('Unauthorized action.');
        setIsSaving(false);
        return;
      }

      await api.put(endpoint, { action, remarks });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      await fetchActionableRequests();
      if (onActionComplete) {
        onActionComplete();
      }
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalSave = async (action) => {
    if (!selected) return;

    if (action === 'reject' && !remarks.trim()) {
      toast.error('A reason is required to reject a request.');
      return;
    }
    
    const isActionable = 
        (user.role === 'HOD' && selected.status === 'Pending HOD') ||
        (user.role === 'faculty' && selected.FacultyActionable && (selected.status === 'Pending Faculty' || selected.status === 'Resubmitted'));

    if (!isActionable) {
        toast.error("This request is not currently actionable by you.");
        return;
    }

    handleAction(selected._id, action, remarks);
  };

  const isHODActionable = (req) => user.role === 'HOD' && req.status === 'Pending HOD';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#333' }}>
        Late Entry Management
      </Typography>
      <StatsFetcher featureType="lateentry" />
      <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#333', mt: 4 }}>
        Actionable Requests
      </Typography>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">Error: {error}</Typography>}
      <Grid container spacing={3}>
        {requests.map((req) => (
          <Grid item xs={12} sm={6} md={4} key={req._id}>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2 }}>{req.studentId?.fullName ? req.studentId.fullName[0] : ''}</Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div" sx={{ color: '#333' }}>{req.studentId?.fullName}</Typography>
                    <Chip
                      label={statusColors[req.status]?.label || req.status}
                      color={statusColors[req.status]?.color || 'default'}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">ID: {req.studentId?.studentId}</Typography>
                  <Typography variant="body2" color="text.secondary">Department: {req.studentId?.department}</Typography>
                  <Typography variant="body2" color="text.secondary"><strong>Reason:</strong> {req.reason}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(req.date || req.lastActionAt).toLocaleString()}</Typography>
                </Box>
                <IconButton onClick={() => handleView(req)}><VisibilityOutlined /></IconButton>
              </Box>
              
              {user.role === 'faculty' && (
                req.FacultyActionable ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAction(req._id, 'approve')}
                      fullWidth
                      disabled={isSaving}
                      startIcon={<CheckOutlined />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleView(req)} 
                      fullWidth
                      disabled={isSaving}
                      startIcon={<CloseOutlined />}
                    >
                      Deny
                    </Button>
                  </Stack>
                ) : (
                  <Button variant="contained" color="warning" disabled fullWidth>
                    Waiting HOD Pre-Approval
                  </Button>
                )
              )}

              {user.role === 'HOD' && (
                  <Box>
                      {isHODActionable(req) ? (
                          <Button variant="contained" color="info" onClick={() => handleView(req)} fullWidth>
                              Action Required
                          </Button>
                      ) : (
                          <Button variant="contained" color="secondary" disabled fullWidth>
                              HOD View Only
                          </Button>
                      )}
                  </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={showModal} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleClose} sx={{ mr: 1 }}><ArrowBack /></IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Late Entry Request
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (() => {
            const isHOD = user.role === 'HOD';
            const isActionable = 
                (isHOD && selected.status === 'Pending HOD') ||
                (!isHOD && selected.FacultyActionable && (selected.status === 'Pending Faculty' || selected.status === 'Resubmitted'));

            return (
              <Box>
                <Typography variant="h6" gutterBottom>Student Information</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 64, height: 64, mr: 2 }}>{selected.studentId?.fullName ? selected.studentId.fullName[0] : ''}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{selected.studentId?.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">ID: {selected.studentId?.studentId}</Typography>
                    <Typography variant="body2" color="text.secondary">Department: {selected.studentId?.department}</Typography>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom>Entry Details</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
                  <Typography>Date & Time</Typography>
                  <Typography>{new Date(selected.date || selected.lastActionAt).toLocaleString()}</Typography>
                </Stack>
                <Box>
                  <Typography>Reason</Typography>
                  <Typography color="text.secondary">{selected.reason}</Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Remarks / Action Reason</Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={isActionable ? "Add remarks for approval or a reason for declining (required for decline)" : "No action required by you at this time."}
                  disabled={!isActionable}
                  variant="outlined"
                />
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          {selected && (() => {
            const isHOD = user.role === 'HOD';
            const isActionable = 
                (isHOD && selected.status === 'Pending HOD') ||
                (!isHOD && selected.FacultyActionable && (selected.status === 'Pending Faculty' || selected.status === 'Resubmitted'));
            return (
              <Stack direction="row" spacing={2} sx={{ width: '100%', p: 1 }}>
                {isActionable ? (
                    <>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleModalSave('reject')}
                          disabled={isSaving}
                          fullWidth
                          startIcon={<CloseOutlined />}
                        >
                            Deny
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleModalSave('approve')}
                          disabled={isSaving}
                          fullWidth
                          startIcon={<CheckOutlined />}
                        >
                            Approve
                        </Button>
                    </>
                ) : (
                    <Button variant="contained" color="secondary" disabled fullWidth>
                        Read-Only (Status: {selected.status})
                    </Button>
                )}
              </Stack>
            );
          })()}
        </DialogActions>
      </Dialog>
    </Box>
  );
}