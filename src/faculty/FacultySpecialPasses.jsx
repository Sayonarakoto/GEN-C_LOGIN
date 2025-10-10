import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Modal,
  TablePagination,
} from '@mui/material';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth'; // Import useAuth

// Component to show the list of pending requests
const PendingRequests = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchPendingPasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/hod/special-passes');
      setPasses(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      setError('Failed to fetch pending requests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPasses();
  }, [fetchPendingPasses]);

  const handleAction = async (passId, action, comment = '') => {
    try {
      // **CRITICAL FIX: Change from POST to PUT and use correct endpoint**
      const endpoint = `/api/hod/special-passes/${passId}/${action === 'Approved' ? 'approve' : 'reject'}`;

      // Backend expects 'hodComment', not 'comment' or 'action' in the body
      await apiClient.put(endpoint, { hodComment: comment }); 

      // Refresh the list after action
      fetchPendingPasses();
    } catch (err) {
      console.error(`Failed to ${action} pass:`, err);
      setError(`Failed to ${action} pass.`);
    }
  };

  const openDeclineModal = (pass) => {
    setSelectedPass(pass);
    setDeclineModalOpen(true);
  };

  const handleDeclineSubmit = () => {
    if (selectedPass) {
      handleAction(selectedPass._id, 'Rejected', declineReason);
    }
    setDeclineModalOpen(false);
    setDeclineReason('');
    setSelectedPass(null);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Pass Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {passes.length > 0 ? (
              passes.map((pass) => (
                <TableRow key={pass._id}>
                  <TableCell>{pass.student_id?.fullName || 'N/A'}</TableCell>
                  <TableCell>{pass.pass_type}</TableCell>
                  <TableCell>{pass.request_reason}</TableCell>
                  <TableCell>
                    {pass.date_valid_from && pass.date_valid_to 
                      ? `${new Date(pass.date_valid_from).toLocaleDateString()} - ${new Date(pass.date_valid_to).toLocaleDateString()}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="contained" color="success" size="small" sx={{ mr: 1 }} onClick={() => handleAction(pass._id, 'Approved')}>Approve</Button>
                    <Button variant="contained" color="error" size="small" onClick={() => openDeclineModal(pass)}>Decline</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No pending requests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={declineModalOpen} onClose={() => setDeclineModalOpen(false)}>
        <DialogTitle>Decline Pass Request</DialogTitle>
        <DialogContent>
          <DialogContentText>Please provide a reason for declining this request.</DialogContentText>
          <TextField autoFocus margin="dense" label="Reason for Decline" type="text" fullWidth variant="standard" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDeclineSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Component for the Initiate Pass form
const InitiatePass = () => {
    const { user } = useAuth(); // Access the authenticated user
    const hodDepartment = user?.department; // Get the HOD's department

    // --- A. New State Variables ---
    const [studentId, setStudentId] = useState('');
    
    const [reason, setReason] = useState('');
    const [dateRequired, setDateRequired] = useState(''); // 🔑 CHANGE: Use single date field
    const [startTime, setStartTime] = useState('');     // 🔑 NEW: Start Time
    const [endTime, setEndTime] = useState('');       // 🔑 NEW: End Time
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdPass, setCreatedPass] = useState(null);

    // State for student table
    const [students, setStudents] = useState([]);
    const [studentTableLoading, setStudentTableLoading] = useState(true);
    const [studentTableError, setStudentTableError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [studentsPerPage] = useState(5);
    const [totalStudents, setTotalStudents] = useState(0);

    const fetchStudents = useCallback(async () => {
        if (!hodDepartment) return; // Don't fetch if department is not available

        setStudentTableLoading(true);
        try {
            const response = await apiClient.get('/api/faculty/students', {
                params: {
                    department: hodDepartment,
                    search: searchQuery,
                    page: currentPage,
                    limit: studentsPerPage,
                },
            });
            setStudents(response.data.students);
            setTotalStudents(response.data.totalStudents);
        } catch (err) {
            setStudentTableError('Failed to fetch student data.');
            console.error(err);
        } finally {
            setStudentTableLoading(false);
        }
    }, [hodDepartment, searchQuery, currentPage, studentsPerPage]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // --- C. Submission Payload (Inside handleSubmit) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/api/hod/special-passes/initiate', {
                student_id: studentId,
                
                request_reason: reason,
                // 🔑 CHANGE: Send the required components for date calculation
                date_required: dateRequired,
                start_time: startTime,
                end_time: endTime,
            });
            setCreatedPass(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate pass.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const PassModal = ({ pass, onClose }) => {
        if (!pass) return null;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pass.qr_token)}`;
        return (
            <Modal open={!!pass} onClose={onClose}>
                <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>Pass Initiated Successfully</Typography>
                    <img src={qrCodeUrl} alt="QR Code" />
                    <Typography variant="body1" mt={2}>Student: {pass.student_id?.fullName}</Typography>
                    <Typography variant="body1">Pass Type: {pass.pass_type}</Typography>
                    <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button>
                </Paper>
            </Modal>
        );
    };

    return (
        <Box>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid xs={12}><Typography variant="h6">Enter Pass Details</Typography></Grid>
                    <Grid xs={12} sm={4}>
                        <TextField fullWidth type="date" label="Date Required" value={dateRequired} onChange={e => setDateRequired(e.target.value)} InputLabelProps={{ shrink: true }} required />
                    </Grid>
                    <Grid xs={12} sm={4}>
                        <TextField fullWidth type="time" label="Start Time" value={startTime} onChange={e => setStartTime(e.target.value)} InputLabelProps={{ shrink: true }} required />
                    </Grid>
                    <Grid xs={12} sm={4}>
                        <TextField fullWidth type="time" label="End Time" value={endTime} onChange={e => setEndTime(e.target.value)} InputLabelProps={{ shrink: true }} required />
                    </Grid>
                    <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Initiate Pass'}</Button>
                    </Grid>
                </Grid>
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            </form>

            {/* Student Details Table */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Student Details</Typography>
                <TextField
                    fullWidth
                    label="Search Students"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    sx={{ mb: 2 }}
                />
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Student ID</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Year</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {studentTableLoading ? (
                                <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : studentTableError ? (
                                <TableRow><TableCell colSpan={4} align="center"><Typography color="error">{studentTableError}</Typography></TableCell></TableRow>
                            ) : students.length > 0 ? (
                                students.map((student) => (
                                    <TableRow key={student._id}>
                                        <TableCell>{student.fullName}</TableCell>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell>{student.department}</TableCell>
                                        <TableCell>{student.year}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} align="center">No students found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={totalStudents}
                    page={currentPage - 1} // MUI pagination is 0-indexed
                    onPageChange={(event, newPage) => setCurrentPage(newPage + 1)} // Convert back to 1-indexed
                    rowsPerPage={studentsPerPage}
                    rowsPerPageOptions={[5]} // Only 5 rows per page
                    onRowsPerPageChange={() => {}} // No change in rows per page allowed
                />
            </Box>
            <PassModal pass={createdPass} onClose={() => setCreatedPass(null)} />
        </Box>
    );
};

export default function FacultySpecialPasses() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Special Pass Management
      </Typography>
      <Paper elevation={2}>
        <Tabs value={tabIndex} onChange={handleTabChange} centered>
          <Tab label="Pending Requests" />
          <Tab label="Initiate Pass" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabIndex === 0 && <PendingRequests />}
          {tabIndex === 1 && <InitiatePass />}
        </Box>
      </Paper>
    </Container>
  );
}