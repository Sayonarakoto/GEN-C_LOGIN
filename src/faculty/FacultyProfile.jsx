import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import useToastService from '../hooks/useToastService';
import { useNavigate } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { styled } from '@mui/material/styles';
import {
    Grid, Paper, TextField, Button, Typography, Box,
    Tabs, Tab, CircularProgress
} from '@mui/material';
import { PersonOutline, School, Timeline } from '@mui/icons-material';
import { upload } from '@vercel/blob/client';
import { resolveProfileImageUrl } from '../utils/resolveProfileImageUrl';

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
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
    color: 'white',
}));

const ProfileHeaderBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    padding: theme.spacing(4),
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px 16px 0 0',
}));

const FacultyProfile = () => {
    const { user, updateUser } = useAuth();
    const toast = useToastService();
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        facultyId: '',
        designation: '',
        email: '',
        profilePictureUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [alert, setAlert] = useState(null);

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
                facultyId: user.employeeId || user.facultyId || '',
                designation: user.designation || '',
                email: user.email || '',
                profilePictureUrl: user.profilePhoto || user.profilePictureUrl || ''
            });
            
            const photoPath = user.profilePhoto || user.profilePictureUrl;
            if (photoPath) {
                setPreviewUrl(resolveProfileImageUrl(photoPath));
            }
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
        setAlert(null);
        try {
            let profilePictureUrl = formData.profilePictureUrl;
            
            if (selectedFile) {
                const useBlob = import.meta.env.VITE_USE_VERCEL_BLOB === 'true';

                if (useBlob) {
                    const blob = await upload(selectedFile.name, selectedFile, {
                        access: 'public',
                        handleUploadUrl: '/api/blob/profile-picture-upload',
                    });
                    profilePictureUrl = blob.url;
                } else {
                    const uploadData = new FormData();
                    uploadData.append('profileImage', selectedFile);
                    const res = await apiClient.post('/api/faculty/upload-profile-picture', uploadData);
                    profilePictureUrl = res.data.filePath;
                }
                setFormData(prev => ({ ...prev, profilePictureUrl }));
            }

            const updatedData = { ...formData, profilePictureUrl };
            await apiClient.put('/api/faculty/profile', updatedData);

            const updatedUser = { ...user, ...updatedData };
            updateUser(updatedUser);

            toast.success('Profile updated successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(errorMessage || 'Failed to update profile.');
        }
    };

    const fullProfilePictureUrl = previewUrl || (formData.profilePictureUrl ? resolveProfileImageUrl(formData.profilePictureUrl) : undefined);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const formatLogDetails = (log) => {
        if (!log.event_details) return '';
        return Object.entries(log.event_details)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join(', ');
    };

    return (
        <Box sx={{ mt: 5, p: 3 }}>
            {alert && <AlertMessage message={alert.message} type={alert.type} />}
            <Paper elevation={3} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <ProfileHeaderBox>
                    <Grid container alignItems="center" spacing={3} sx={{ zIndex: 2, position: 'relative' }}>
                        <Grid item xs={12} md={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
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
                        <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>{formData.fullName}</Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9, mt: 0.5 }}>{formData.designation} - {user?.department}</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{formData.email}</Typography>
                        </Grid>
                    </Grid>
                </ProfileHeaderBox>

                <Box sx={{ p: 3 }}>
                    <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tab label="Account Settings" icon={<PersonOutline />} iconPosition="start" />
                        <Tab label="My Department" icon={<School />} iconPosition="start" />
                        <Tab label="Activity Log" icon={<Timeline />} iconPosition="start" />
                    </Tabs>

                    {currentTab === 0 && (
                        <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
                            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Faculty ID" name="facultyId" value={formData.facultyId} InputProps={{ readOnly: true }} margin="normal" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} margin="normal" />
                                    </Grid>
                                </Grid>
                            </Paper>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                                <Button type="submit" variant="contained" color="primary">Save Changes</Button>
                            </Box>
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Faculty Members in {user?.department} Department</Typography>
                            {loadingMembers ? <CircularProgress /> : membersError ? <Typography color="error">{membersError}</Typography> : (
                                <Grid container spacing={3} sx={{ mt: 1 }}>
                                    {departmentMembers.map((member) => (
                                        <Grid item xs={12} sm={6} md={4} key={member._id}>
                                            <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={member.profilePictureUrl ? resolveProfileImageUrl(member.profilePictureUrl) : undefined} sx={{ bgcolor: '#6366f1' }}>
                                                    {member.fullName?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold">{member.fullName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{member.designation}</Typography>
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
                            {loadingLogs ? <CircularProgress /> : logsError ? <Typography color="error">{logsError}</Typography> : (
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {auditLogs.map((log) => (
                                        <Grid item xs={12} key={log._id}>
                                            <Paper elevation={1} sx={{ p: 2 }}>
                                                <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleString()}</Typography>
                                                <Typography variant="subtitle2" fontWeight="bold">{log.event_type}</Typography>
                                                <Typography variant="body2">{formatLogDetails(log)}</Typography>
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
