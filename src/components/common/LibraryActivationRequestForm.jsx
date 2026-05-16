import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import useToastService from '../../hooks/useToastService';
import {
  Box,
  Typography,
  Button,
  Paper,
  InputLabel,
  FormHelperText,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { CheckCircle, Cancel, HourglassEmpty, LocalLibrary, Download } from '@mui/icons-material';

const LibraryActivationRequestForm = () => {
  const { user } = useContext(AuthContext);
  const toast = useToastService();

  const [idProof, setIdProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState('loading'); // loading, none, pending, approved, rejected
  const [passData, setPassData] = useState(null);

  // Fetch current status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      const userId = user?.id || user?._id;
      if (!userId || userId === 'undefined') return;
      try {
        // Check status for the current user
        const response = await apiClient.get(`/api/library/status/${userId}`);
        if (response.data && response.data.success && response.data.data) {
          setRequestStatus(response.data.data.status.toLowerCase());
          setPassData(response.data.data);
        } else {
          setRequestStatus('none');
        }
      } catch (err) {
        // If 404 or error, assume no active request exists
        setRequestStatus('none');
      }
    };
    fetchStatus();
  }, [user]);

  const handleFileChange = (e) => {
    setIdProof(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Resolve user details based on different schema variations (Student vs Faculty)
    // Checks for fullName (Faculty/Student) vs name, and specific ID fields
    const userName = user?.name || user?.fullName || '';
    const userDept = user?.department?.name || user?.department || '';
    const userId = user?.facultyId || user?.studentId || user?.uid || '';
    const userEmail = user?.email || '';

    const submissionData = new FormData();
    submissionData.append('fullName', userName);
    submissionData.append('role', user?.role || '');
    submissionData.append('department', userDept);
    submissionData.append('institutionId', userId);
    submissionData.append('email', userEmail);
    submissionData.append('passType', 'Digital Library Card');
    if (idProof) submissionData.append('idProof', idProof);
    submissionData.append('userId', user.id || user._id);

    try {
      await apiClient.post('/library/activation-request', submissionData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Your library ID activation request has been submitted successfully!');
      setRequestStatus('pending');
      setPassData(null); 
      // Optionally reset form here
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPass = async () => {
    if (!passData?._id) return;
    try {
      const response = await apiClient.get(`/api/library/pass/download/${passData._id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library_pass_${user.name || 'card'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download pass.');
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <Typography variant="body1" color="textSecondary">
          Loading user data...
        </Typography>
      </Box>
    );
  }

  // 1. Loading State
  if (requestStatus === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper variables for display to handle different user object structures
  const rawImg = user.profilePictureUrl || user.profilePhoto;
  const normalizedImg = rawImg ? rawImg.replace(/\\/g, '/') : '';
  const displayImg = normalizedImg ? `http://localhost:3001${normalizedImg.startsWith('/') ? '' : '/'}${normalizedImg}` : undefined;
  const displayName = user.name || user.fullName || 'N/A';
  const displayDept = user.department?.name || user.department || 'N/A';
  const displayId = user.facultyId || user.studentId || user.uid || 'N/A';

  // 2. Approved State - Digital Card Profile
  if (requestStatus === 'approved') {
    return (
      <Card sx={{ maxWidth: 500, mx: 'auto', borderRadius: 4, boxShadow: 4, border: '1px solid #e0e0e0', position: 'relative', overflow: 'visible' }}>
        {/* Active Badge */}
        <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
          <Chip 
            icon={<CheckCircle style={{ color: 'white' }} />} 
            label="ACTIVE" 
            color="success" 
            sx={{ fontWeight: 'bold', color: 'white', bgcolor: '#2e7d32' }} 
          />
        </Box>

        <CardContent sx={{ textAlign: 'center', pt: 5, pb: 4 }}>
          <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#1a237e' }}>
            <LocalLibrary fontSize="large" />
          </Avatar>
          
          <Typography variant="h5" fontWeight="800" gutterBottom sx={{ color: '#1a237e' }}>
            DIGITAL LIBRARY PASS
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            GEN-C CAMPUS LIBRARY
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Avatar 
              src={displayImg}
              alt={displayName}
              imgProps={{ onError: (e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; } }}
              sx={{ width: 100, height: 100, mb: 2, border: '4px solid #fff', boxShadow: 3 }}
            />
            <Typography variant="h6" fontWeight="bold">{displayName}</Typography>
            <Typography variant="body1" color="text.secondary">
              {user.role} | {displayDept}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f5f5f5', px: 2, py: 0.5, borderRadius: 1, mt: 1 }}>
              ID: {displayId}
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px dashed #4caf50' }}>
            <Typography variant="caption" display="block" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
              Approved By
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ fontSize: '1.1rem' }}>
              {passData?.approvedBy?.fullName || passData?.approvedBy || 'Librarian Staff'}
            </Typography>
          </Box>

          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Download />} 
            onClick={handleDownloadPass}
            sx={{ mt: 3 }}
          >
            Download Digital Pass
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. Pending State
  if (requestStatus === 'pending') {
    return (
      <Paper elevation={3} sx={{ maxWidth: 600, mx: 'auto', p: 5, borderRadius: 3, textAlign: 'center' }}>
        <HourglassEmpty sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Request Under Review
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Your request for a Digital Library ID has been submitted and is currently pending approval by the library staff.
        </Typography>
        <Alert severity="info" sx={{ mt: 2, justifyContent: 'center' }}>
          You will be notified once your request is processed.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ maxWidth: 600, mx: 'auto', p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
        Permanent Digital Library ID Request
      </Typography>
      
      {requestStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Cancel fontSize="inherit" />}>
          <Typography variant="subtitle2" fontWeight="bold">Request Declined</Typography>
          {passData?.rejectionReason || 'Your previous request was declined. Please check your details and try again.'}
        </Alert>
      )}

      <Typography variant="body2" color="textSecondary" textAlign="center" mb={4}>
        Submit to activate your digital library ID. Your profile details are auto-filled from your account.
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Auto-filled details */}
        <Box mb={3} sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Your details (from your account):
          </Typography>
          <Typography variant="body2"><strong>Name:</strong> {displayName}</Typography>
          <Typography variant="body2"><strong>Role:</strong> {user?.role || 'N/A'}</Typography>
          <Typography variant="body2"><strong>Department:</strong> {displayDept}</Typography>
          <Typography variant="body2"><strong>Institute/College ID:</strong> {displayId}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {user?.email || 'N/A'}</Typography>
        </Box>

        {/* ID Proof Upload */}
        <Box mb={3}>
          <InputLabel htmlFor="idProof">
            Upload ID Proof <Typography component="span" color="text.secondary" fontWeight="normal">(Optional)</Typography>
          </InputLabel>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mt: 1 }}
          >
            {idProof ? idProof.name : 'Choose File'}
            <input
              type="file"
              hidden
              id="idProof"
              name="idProof"
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.pdf"
            />
          </Button>
          <FormHelperText>PNG, JPG, PDF up to 10MB</FormHelperText>
        </Box>

        {/* Error message */}
        {error && (
          <Typography variant="body2" color="error" textAlign="center" mb={2}>
            {error}
          </Typography>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Box>
    </Paper>
  );
};

export default LibraryActivationRequestForm;
