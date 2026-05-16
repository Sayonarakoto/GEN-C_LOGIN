import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import useToastService from '../../hooks/useToastService';
import AlertMessage from '../../components/AlertMessage';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { styled } from '@mui/material/styles';
import { Grid, Paper, TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { upload } from '@vercel/blob/client'; // Import upload
import { resolveProfileImageUrl } from '../../utils/resolveProfileImageUrl'; // Import utility

// ... (Styled components remain same)

const LibrarianProfile = () => {
    const { user, updateUser } = useAuth();
    const toast = useToastService();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: '',
        facultyId: '',
        department: '',
        email: '',
        profilePictureUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [alert, setAlert] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                facultyId: user.facultyId || '',
                department: user.department || 'Library',
                email: user.email || '',
                profilePictureUrl: user.profilePictureUrl || ''
            });
            
            if (user.profilePictureUrl) {
                setPreviewUrl(resolveProfileImageUrl(user.profilePictureUrl));
            }
        }
    }, [user]);

    // ... (handleInputChange, handleFileChange, handleUploadButtonClick remain same)

    const handleUpdate = async (e) => {
        e.preventDefault();
        setAlert(null);
        setUploading(true);
        try {
            let profilePictureUrl = formData.profilePictureUrl;
            
            if (selectedFile) {
                const useBlob = import.meta.env.VITE_USE_VERCEL_BLOB === 'true';

                if (useBlob) {
                    const blob = await upload(selectedFile.name, selectedFile, {
                        access: 'public',
                        handleUploadUrl: '/blob/profile-picture-upload',
                    });
                    profilePictureUrl = blob.url;
                } else {
                    const uploadData = new FormData();
                    uploadData.append('profileImage', selectedFile);
                    const res = await apiClient.post('/librarian/upload-profile-picture', uploadData);
                    profilePictureUrl = res.data.filePath;
                }
                setFormData(prev => ({ ...prev, profilePictureUrl }));
            }

            const updatedData = { ...formData, profilePictureUrl };
            await apiClient.put('/librarian/profile', updatedData);

            const updatedUser = { ...user, ...updatedData };
            updateUser(updatedUser);

            toast.success('Profile updated successfully!');
        } catch (error) {
            // ... (error handling remains same)
        } finally {
            setUploading(false);
        }
    };

    let fullProfilePictureUrl = 'https://via.placeholder.com/150';
    if (previewUrl) {
        fullProfilePictureUrl = previewUrl;
    } else if (formData.profilePictureUrl) {
        fullProfilePictureUrl = resolveProfileImageUrl(formData.profilePictureUrl);
    }
    
    // ... (rest of the component)


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
                                {uploading && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                            zIndex: 1,
                                        }}
                                    >
                                        <CircularProgress color="inherit" />
                                    </Box>
                                )}
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
                            <Typography variant="body2" color="text.secondary">Librarian</Typography>
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
                                        label="Librarian ID"
                                        name="facultyId"
                                        value={formData.facultyId}
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
                                        InputProps={{ readOnly: true }}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
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

export default LibrarianProfile;