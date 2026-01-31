import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
    Box,
    Typography,
    Avatar,
    Stack,
    Divider,
    Chip,
    TextField
} from '@mui/material';
import { Person, Badge, School, Email, Book, Warning } from '@mui/icons-material';
import api from '../../api/client';
import useToastService from '../../hooks/useToastService';

const MemberProfileModal = ({ open, onClose, userId }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deactivating, setDeactivating] = useState(false);
    const [deactivationReason, setDeactivationReason] = useState('');
    const toast = useToastService();

    useEffect(() => {
        if (open && userId) {
            const fetchDetails = async () => {
                setLoading(true);
                setError('');
                try {
                    const response = await api.get(`/api/library/members/${userId}`);
                    setDetails(response.data.data);
                } catch (err) {
                    setError('Failed to fetch member details.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        }
    }, [open, userId]);

    const handleDeactivate = async () => {
        if (!deactivationReason) {
            toast.error('Please provide a reason for deactivation.');
            return;
        }
        setDeactivating(true);
        try {
            await api.put(`/api/library/members/${userId}/deactivate`, { reason: deactivationReason });
            toast.success('Library card has been successfully deactivated.');
            onClose(); // Close modal on success
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to deactivate card.');
            console.error(err);
        } finally {
            setDeactivating(false);
        }
    };

    const getProfileSrc = (profile) => {
        if (!profile) return null;
        const path = profile.profilePictureUrl || profile.profilePhoto;
        if (!path) return null;
        const normalized = path.replace(/\\/g, '/').replace('/static/uploads', '/uploads');
        return `http://localhost:3001${normalized.startsWith('/') ? '' : '/'}${normalized}`;
    };

    const profile = details?.profile;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogContent dividers>
                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {details && profile && (
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={getProfileSrc(profile)} sx={{ width: 80, height: 80 }}>
                                {profile.fullName?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">{profile.fullName}</Typography>
                                <Typography variant="body1" color="text.secondary">{profile.studentId || profile.employeeId}</Typography>
                                <Chip label={profile.role} color="primary" size="small" sx={{ mt: 1, textTransform: 'capitalize' }} />
                            </Box>
                        </Stack>
                        <Divider />
                        <Stack spacing={1.5}>
                            <InfoItem icon={<School />} label="Department" value={profile.department} />
                            {profile.year && <InfoItem icon={<Badge />} label="Year" value={profile.year} />}
                            <InfoItem icon={<Email />} label="Email" value={profile.email} />
                            <InfoItem icon={<Book />} label="Currently Borrowed Books" value={details.borrowingCount} />
                        </Stack>
                        <Divider />
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Actions</Typography>
                            <Alert severity="warning" icon={<Warning />}>
                                Deactivating a card is a permanent action. The user will need to re-apply for activation.
                            </Alert>
                             <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Reason for Deactivation"
                                value={deactivationReason}
                                onChange={(e) => setDeactivationReason(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeactivate}
                    disabled={deactivating || !details}
                >
                    {deactivating ? <CircularProgress size={24} color="inherit" /> : 'Deactivate Card'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <Stack direction="row" alignItems="center" spacing={1.5}>
        {React.cloneElement(icon, { color: 'action' })}
        <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body1" fontWeight="medium">{value}</Typography>
        </Box>
    </Stack>
);

export default MemberProfileModal;