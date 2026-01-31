import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const RequestLibraryPass = () => {
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Standardize the pass type; no manual input required
            await api.post('/api/library/request-pass', { passType: 'Standard' });
            setNotification({ type: 'success', message: 'Library pass requested successfully!' });
            setTimeout(() => navigate('/student'), 2000); // Redirect after 2 seconds
        } catch (error) {
            console.error('Failed to request library pass', error);
            setNotification({ type: 'error', message: 'Failed to request library pass.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h5" gutterBottom>Request Library Pass</Typography>
                {notification && <Alert severity={notification.type} sx={{ mb: 2 }}>{notification.message}</Alert>}
                <form onSubmit={handleSubmit}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Submit a request for a standard student library pass. No additional input needed.
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                        >
                            Request Pass
                        </Button>
                        {loading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        )}
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default RequestLibraryPass;
