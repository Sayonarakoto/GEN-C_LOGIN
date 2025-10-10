import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import useToastService from '../hooks/useToastService';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage'; // Import AlertMessage

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { styled } from '@mui/material/styles';
import {
    Grid, Paper, TextField, Button, Typography, Box,
    Tabs, Tab, CircularProgress
} from '@mui/material';
import { PersonOutline, School, Timeline, EmailOutlined, PhoneOutlined } from '@mui/icons-material';

// Styled components for the avatar and upload button
const AvatarContainer = styled('div')({
    position: 'relative',
    display: 'inline-block',
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 120,
    height: 120,
    border: '4px solid white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    objectFit: 'cover',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Placeholder background
    fontSize: 48,
    fontWeight: 600,
    color: 'white',
}));

const UploadButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    background: '#6366f1',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: '#4f46e5',
        transform: 'scale(1.1)',
    },
    color: 'white', // Icon color
}));

const ProfileHeaderBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    padding: theme.spacing(4),
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px 16px 0 0',
    '&::before': {
        content: "' '",
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"white\" opacity=\"0.1\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"white\" opacity=\"0.1\"/><circle cx=\"50\" cy=\"10\" r=\"0.5\" fill=\"white\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\" /></svg>")',
        opacity: 0.3,
        zIndex: 1,
    },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    },
}));

const FacultyProfile = () => {
    const { user, login, token } = useAuth();
    const toast = useToastService();
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        facultyId: '',
        department: '',
        designation: '',
        email: '',
        profilePictureUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [alert, setAlert] = useState(null); // { message, type }

    const [departmentMembers, setDepartmentMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState(null);

    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logsError, setLogsError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                facultyId: user.facultyId || '',
                department: user.department || '',
                designation: user.designation || '',
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || ''
            });
            setPreviewUrl(user.profilePictureUrl ? `http://localhost:3001${user.profilePictureUrl}` : null);
        }
    }, [user]);

    useEffect(() => {
        if (currentTab === 1 && user?.department) {
            const fetchDepartmentMembers = async () => {
                setLoadingMembers(true);
                setMembersError(null);
                try {
                    const response = await apiClient.get('/api/faculty/department-members');
                    if (response.data.success) {
                        setDepartmentMembers(response.data.data);
                    } else {
                        setMembersError(response.data.message || 'Failed to fetch department members.');
                    }
                } catch (err) {
                    console.error('Error fetching department members:', err);
                    setMembersError(err.response?.data?.message || 'Failed to fetch department members.');
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchDepartmentMembers();
        }
    }, [currentTab, user?.department]);

    useEffect(() => {
        if (currentTab === 2 && user?.department) {
            const fetchAuditLogs = async () => {
                setLoadingLogs(true);
                setLogsError(null);
                try {
                    const response = await apiClient.get('/api/audit/department-logs');
                    if (response.data.success) {
                        setAuditLogs(response.data.data);
                    } else {
                        setLogsError(response.data.message || 'Failed to fetch audit logs.');
                    }
                } catch (err) {
                    console.error('Error fetching audit logs:', err);
                    setLogsError(err.response?.data?.message || 'Failed to fetch audit logs.');
                } finally {
                    setLoadingLogs(false);
                }
            };
            fetchAuditLogs();
        }
    }, [currentTab, user?.department]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setAlert(null); // Clear previous alerts
        try {
            let profilePictureUrl = formData.profilePictureUrl;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('profileImage', selectedFile);
                const res = await apiClient.post('/api/faculty/upload-profile-picture', uploadData);
                profilePictureUrl = res.data.filePath;
            }

            const updatedData = { ...formData, profilePictureUrl };
            await apiClient.put('/api/faculty/profile', updatedData);

            const updatedUser = { ...user, ...updatedData };
            login(token, updatedUser);

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating faculty profile', error);
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage.includes('File too large')) {
                setAlert({ message: 'Image is too large. Please select a smaller file.', type: 'error' });
            } else {
                toast.error('Failed to update profile.');
            }
        }
    };

    const fullProfilePictureUrl = previewUrl || (formData.profilePictureUrl ? `http://localhost:3001${formData.profilePictureUrl}` : undefined);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const formatLogDetails = (log) => {
        let details = [];
        if (log.event_details) {
            for (const key in log.event_details) {
                if (Object.hasOwnProperty.call(log.event_details, key)) {
                    let value = log.event_details[key];
                    if (typeof value === 'object' && value !== null) {
                        value = JSON.stringify(value); // Stringify objects for display
                    }
                    details.push(`${key}: ${value}`);
                }
            }
        }
        return details.join(', ');
    };

    return (
        <Box sx={{ mt: 5, p: 3 }}>
            {alert && <AlertMessage message={alert.message} type={alert.type} />}
            <Paper elevation={3} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <ProfileHeaderBox>
                    <Grid container alignItems="center" spacing={3} sx={{ zIndex: 2, position: 'relative' }}>
                        <Grid xs={12} md={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                            <AvatarContainer>
                                <StyledAvatar
                                    src={fullProfilePictureUrl}
                                    alt={formData.fullName ? formData.fullName.charAt(0).toUpperCase() : ''}
                                    imgProps={{ onError: (e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; } }}
                                >
                                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : ''}
                                </StyledAvatar>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                                <UploadButton onClick={handleUploadButtonClick}>
                                    <CameraAltIcon fontSize="small" />
                                </UploadButton>
                            </AvatarContainer>
                        </Grid>
                        <Grid xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>{formData.fullName}</Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9, mt: 0.5 }}>{formData.designation} - {formData.department}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mt: 1 }}>
                                
                                <Typography variant="body1">{formData.email}</Typography>
                            </Box>
                            {/* Add phone if available */}
                            {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mt: 0.5 }}>
                                <PhoneOutlined sx={{ mr: 1 }} />
                                <Typography variant="body1">+1 (555) 123-4567</Typography>
                            </Box> */}
                        </Grid>
                        {/* Removed Stats Cards */}
                    </Grid>
                </ProfileHeaderBox>

                <Box sx={{ p: 3 }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="faculty profile tabs" sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tab label="Account Settings" icon={<PersonOutline />} iconPosition="start" />
                        <Tab label="My Department" icon={<School />} iconPosition="start" />
                        <Tab label="Activity Log" icon={<Timeline />} iconPosition="start" />
                    </Tabs>

                    {/* Tab Content */}
                    {currentTab === 0 && (
                        <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
                            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonOutline /> Personal Information
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid xs={12} sm={6}>
                                        <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <TextField fullWidth label="Faculty ID" name="facultyId" value={formData.facultyId} InputProps={{ readOnly: true }} margin="normal" />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <TextField fullWidth label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                    <Grid xs={12} sm={6}>
                                        <TextField fullWidth label="Department" name="department" value={formData.department} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                <Button variant="outlined" color="secondary">Cancel</Button>
                                <Button type="submit" variant="contained" color="primary">Save Changes</Button>
                            </Box>
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Faculty Members in {user?.department} Department</Typography>
                            {loadingMembers ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : membersError ? (
                                <Typography color="error" sx={{ mt: 3 }}>Error: {membersError}</Typography>
                            ) : departmentMembers.length === 0 ? (
                                <Typography sx={{ mt: 3 }}>No other faculty members found in your department.</Typography>
                            ) : (
                                <Grid container spacing={3} sx={{ mt: 2 }}>
                                    {departmentMembers.map((member) => (
                                        <Grid item xs={12} sm={6} md={4} key={member._id}>
                                            <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={member.profilePictureUrl ? `http://localhost:3001${member.profilePictureUrl}` : undefined}
                                                    alt={member.fullName ? member.fullName.charAt(0).toUpperCase() : ''}
                                                    sx={{ bgcolor: '#6366f1' }}
                                                >
                                                    {member.fullName ? member.fullName.charAt(0).toUpperCase() : ''}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold">{member.fullName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{member.designation}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {currentTab === 2 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Recent Activity Log</Typography>
                            {loadingLogs ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : logsError ? (
                                <Typography color="error" sx={{ mt: 3 }}>Error: {logsError}</Typography>
                            ) : auditLogs.length === 0 ? (
                                <Typography sx={{ mt: 3 }}>No recent activity found for your department.</Typography>
                            ) : (
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    {auditLogs.map((log) => (
                                        <Grid item xs={12} key={log._id}>
                                            <Paper elevation={1} sx={{ p: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </Typography>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {log.event_type} by {log.actor_id?.fullName || 'Unknown'} ({log.actor_id?.role || 'N/A'})
                                                </Typography>
                                                {log.pass_id && (
                                                    <Typography variant="body2">
                                                        Pass Type: {log.pass_id.pass_type}, Status: {log.pass_id.status}
                                                    </Typography>
                                                )}
                                                {log.event_details && (
                                                    <Typography variant="body2">
                                                        Details: {formatLogDetails(log)}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default FacultyProfile;