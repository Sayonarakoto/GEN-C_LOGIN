import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Modal,
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import apiClient from '../api/client';

// Modal to display pass details and QR code
const PassDetailsModal = ({ pass, open, onClose }) => {
  if (!pass) return null;

  // CRITICAL FIX: Use the secure JWT token for QR code data if available.
  const isApprovedAndFinal = pass.status === 'Approved (Final)';
  
  // Data to encode in QR: Use the JWT if available/final, otherwise fallback to the pass ID for identification.
  const qrCodeData = isApprovedAndFinal && pass.qr_code_jwt 
                     ? pass.qr_code_jwt 
                     : JSON.stringify({ pass_id: pass._id });

  // Use the data to generate the image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`;

  // Define the base URL for the PDF download
  // NOTE: Based on the raw data you sent earlier, the path was:
  // "pdf_path": "/home/najeezzz/login/GEN-C_LOGIN/server/generated_pdfs/68e2d9842a1f174..."
  // You MUST update the pdfDownloadUrl logic to point to a valid Express static route.
  // Assuming you serve files from the root `/uploads` or `/generated_pdfs`. Let's use a standard pattern:
  const pdfDownloadLink = pass.pdf_path 
                          ? `/api/downloads/special-pass/${pass._id}` // <--- Use an API endpoint to serve it securely
                          : null; 


  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, p: 4, outline: 'none' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}><Close /></IconButton>
        <Typography variant="h5" gutterBottom>Pass Details</Typography>
        <Typography variant="body1"><strong>Type:</strong> {pass.pass_type}</Typography>
        <Typography variant="body1"><strong>Date:</strong> {new Date(pass.date_valid_from).toLocaleDateString()}</Typography>
        <Typography variant="body1"><strong>Status:</strong> {pass.status}</Typography>
        <Typography variant="body1"><strong>Reason:</strong> {pass.request_reason}</Typography>
        
        {/* Conditional rendering for Approved passes */}
        {(pass.status === 'Approved' || isApprovedAndFinal) ? (
          <Box sx={{ mt: 2, textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
            <Typography variant="h6">Pass Verification</Typography>
            
            {/* Show QR and OTP only for final, verified passes */}
            {isApprovedAndFinal && pass.qr_code_jwt ? (
                <>
                    <img src={qrCodeUrl} alt="QR Code for pass" style={{ margin: '8px 0' }} />
                    {pass.verification_otp && (
                        <Typography variant="h5" color="primary">OTP: <strong>{pass.verification_otp}</strong></Typography>
                    )}
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Show this to security for exit/entry verification.
                    </Typography>
                </>
            ) : (
                // This is the section currently displaying "Approved (Internal/Pending Finalization)"
                 <Typography variant="body1" color="text.secondary">
                    {pass.status === 'Approved' 
                        ? 'Approved (Internal/Pending Finalization)' 
                        : 'No external verification required.'
                    }
                 </Typography>
            )}

            {/* 🔑 NEW: Display PDF Download Button if pdf_path exists */}
            {pass.pdf_path && (
                <Stack sx={{ mt: 2 }} alignItems="center">
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="medium"
                        onClick={async () => {
                            try {
                                // Make the request using apiClient to include Authorization header
                                const response = await apiClient.get(
                                    `/api/special-passes/downloads/special-pass/${pass._id}`,
                                    { responseType: 'blob' } // Important: tell Axios to expect a binary response
                                );

                                // Create a blob URL and trigger download
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `special_pass_${pass._id}.pdf`); // Set the filename
                                document.body.appendChild(link);
                                link.click();
                                link.parentNode.removeChild(link); // Clean up
                                window.URL.revokeObjectURL(url); // Free up memory
                                // console.log(`🟢 FRONTEND DEBUG: PDF download initiated for pass ID: ${pass._id}`); // Removed
                            } catch (downloadError) {
                                console.error("🟢 FRONTEND DEBUG: Error downloading PDF:", downloadError);
                                // You might want to show a toast notification here
                                alert('Failed to download PDF. Please try again.');
                            }
                        }}
                    >
                        Download PDF Pass
                    </Button>
                    <Typography variant="caption" sx={{ mt: 1 }}>
                        {`PDF Pass ready for download.`}
                    </Typography>
                </Stack>
            )}
            
          </Box>
        ) : null}
      </Paper>
    </Modal>
  );
};

export default function StudentSpecialPassRequest() {
  // Form State
  const [passType, setPassType] = useState('');
  const [reason, setReason] = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [startTime, setStartTime] = useState('');     // e.g., "09:00"
  const [endTime, setEndTime] = useState('');       // e.g., "16:00"
  const [needsPhysicalPass, setNeedsPhysicalPass] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Pass List State
  const [passes, setPasses] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);

  const statusColors = {
    Approved: 'success',
    Pending: 'warning',
    Rejected: 'error',
    'Approved (Final)': 'success', // Added for new status
  };

  // CRITICAL FIX A: Using useCallback and adding fetchPasses dependency
  const fetchPasses = useCallback(async () => {
    setListLoading(true);
    try {
      // 1. Correct the API path
      const response = await apiClient.get('/api/special-passes/student');
      
      // 2. Correctly extract the nested data array
      const passesData = response.data?.data;

      setPasses(Array.isArray(passesData) ? passesData : []);
    } catch (err) {
      console.error("Failed to fetch passes:", err);
      setError('Failed to load recent passes.');
      setPasses([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]); // Dependency ensures it runs once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      // The backend expects: date_required, start_time, end_time
      await apiClient.post('/api/special-passes/request', {
        pass_type: passType,
        request_reason: reason,
        
        // 🔑 FIX 1: Send the required date key
        date_required: dateRequired, 
        
        // 🔑 FIX 2: Send the start time key
        start_time: startTime,
        
        // 🔑 FIX 3: Send the end time key
        end_time: endTime,
        
        // FIX 4: Correctly send the is_one_time_use flag
        is_one_time_use: !needsPhysicalPass, // Assuming is_one_time_use is the boolean inverse of needsPhysicalPass, or based on your model/logic

      });
      
      // Reset form
      setPassType('');
      setReason('');
      setDateRequired('');
      setStartTime(''); // Reset new states
      setEndTime('');   // Reset new states
      setNeedsPhysicalPass(false);
      
      // Rerun fetch to get the updated list, including the new pass.
      await fetchPasses(); 

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDetails = (pass) => {
    setSelectedPass(pass);
    setDetailsModalOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Pass Request Form */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Submit New Special Pass Request
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Fill out the details below to request a new gate pass.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Reason for Pass"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Medical appointment, project fieldwork, sports practice"
              required
              disabled={formLoading}
            />
            <FormControl fullWidth disabled={formLoading} required>
              <InputLabel>Pass Type</InputLabel>
              <Select value={passType} label="Pass Type" onChange={(e) => setPassType(e.target.value)}>
                <MenuItem value="Lab Entry">Lab Entry</MenuItem>
                <MenuItem value="Late Entry">Late Entry</MenuItem>
                <MenuItem value="Mosque Pass">Mosque Pass</MenuItem>
                <MenuItem value="ID Lost">ID Lost</MenuItem>
                <MenuItem value="Improper Uniform">Improper Uniform</MenuItem>
                <MenuItem value="Event Pass">Event Pass</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Date Required"
              type="date"
              value={dateRequired}
              onChange={(e) => setDateRequired(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              disabled={formLoading}
            />
            <TextField
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              disabled={formLoading}
            />
            <TextField
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              disabled={formLoading}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={needsPhysicalPass}
                  onChange={(e) => setNeedsPhysicalPass(e.target.checked)}
                  disabled={formLoading}
                />
              }
              label="I require a physical/printed gate pass (optional)"
            />
            <Box>
                <Button type="submit" variant="contained" size="large" disabled={formLoading}>
                    {formLoading ? <CircularProgress size={24} /> : 'Submit Request'}
                </Button>
            </Box>
          </Stack>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </form>
      </Paper>

      {/* Recent Passes List */}
      <Typography variant="h5" component="h2" gutterBottom>
        Recent Passes
      </Typography>
      {listLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Pass Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(passes) && passes.map((pass, index) => (
                <TableRow key={pass._id ? String(pass._id) : index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{pass.pass_type}</TableCell>
                  <TableCell>{pass.request_reason}</TableCell>
                  <TableCell>{new Date(pass.date_valid_from).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={pass.status} color={statusColors[pass.status] || 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleViewDetails(pass)}>View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal for viewing pass details */}
      <PassDetailsModal pass={selectedPass} open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} />
    </Container>
  );
}