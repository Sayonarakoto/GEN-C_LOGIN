import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client'; // Assuming you have an axios client setup
import { useAuth } from '../hooks/useAuth'; // Assuming you have an auth hook
import useToastService from '../hooks/useToastService'; // Import the toast service
import AlertMessage from '../components/AlertMessage'; // Import AlertMessage
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { styled } from '@mui/material/styles';
import { Grid, Paper, TextField, Button, Typography, Box } from '@mui/material';

// Styled components for the avatar and upload button to match desgintemp.html
const AvatarContainer = styled('div')({
    position: 'relative',
    display: 'inline-block',
});

const StyledAvatar = styled(Avatar)(() => ({
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

const UploadButton = styled(IconButton)(() => ({
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


const StudentProfile = () => {
    const { user, login, token } = useAuth(); // Get user, login, and token from auth context
    const toast = useToastService(); // Initialize toast service
    const fileInputRef = useRef(null); // Ref for the hidden file input

    const [formData, setFormData] = useState({
        fullName: '',
        registerNumber: '',
        department: '',
        year: '',
        email: '',
        profilePictureUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // State for image preview
    const [alert, setAlert] = useState(null); // { message, type }

    useEffect(() => {
        // Assuming the 'user' object from useAuth contains the student details
        if (user) {
            console.log('User object in StudentProfile:', user);
            setFormData({
                fullName: user.fullName || '',
                registerNumber: user.studentId || '',
                department: user.department || '',
                year: user.year || '',
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || '' // Set to empty string if no URL
            });
            setPreviewUrl(user.profilePictureUrl ? `http://localhost:3001${user.profilePictureUrl}` : null);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Create a local URL for preview
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current.click(); // Trigger the hidden file input
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setAlert(null); // Clear previous alerts
        try {
            // First, upload image if a new one is selected
            let profilePictureUrl = formData.profilePictureUrl;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('profileImage', selectedData);
                const res = await apiClient.post('/api/student/upload-profile-picture', uploadData);
                profilePictureUrl = res.data.filePath;
            }

            // Then, update the rest of the profile data
            const updatedData = { ...formData, profilePictureUrl };
            await apiClient.put('/api/student/profile', updatedData);

            // Update the user context with the new data
            const updatedUser = { ...user, ...updatedData };
            login(token, updatedUser);

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile', error);
            const errorMessage = error.response?.data?.message || error.message;
            if (errorMessage.includes('File too large')) {
                setAlert({ message: 'Image is too large. Please select a smaller file.', type: 'error' });
            } else {
                toast.error('Failed to update profile.');
            }
        }
    };

    console.log('formData.profilePictureUrl', formData.profilePictureUrl);

    const fullProfilePictureUrl = previewUrl || (formData.profilePictureUrl ? `http://localhost:3001${formData.profilePictureUrl}` : 'https://via.placeholder.com/150');

    return (
        <Box sx={{ mt: 5, p: 3 }}>
            {alert && <AlertMessage message={alert.message} type={alert.type} />}
            <form onSubmit={handleUpdate}>
                <Grid container spacing={3} direction="column">
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
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
                            <Typography variant="h6" sx={{ mt: 2 }}>{formData.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary">{formData.registerNumber}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>Profile Information</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Register Number"
                                        name="registerNumber"
                                        value={formData.registerNumber}
                                        InputProps={{ readOnly: true }}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Year"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                    >
                                        Update Profile
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default StudentProfile;