import React, { useState, useEffect, useCallback } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    InputAdornment,
    Grid,
    IconButton,
    Typography,
    Avatar,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip
} from '@mui/material';
import { Close, Visibility, CheckCircle, Cancel, AccessTime, Search, FilterList, WarningAmber, Check } from '@mui/icons-material';
import api from '../../api/client';
import { socket } from '../../socket';
import { resolveProfileImageUrl } from '../../utils/resolveProfileImageUrl';
    
const PendingPasses = () => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [filterYear, setFilterYear] = useState('All');

    const fetchPendingPasses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/library/librarypass/pending');
            setPasses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pending passes', error);
            setNotification({ type: 'error', message: 'Failed to fetch pending passes.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingPasses();

        // Ensure the global socket is connected for real-time updates
        socket.connect();

        const handleNewPassRequest = (newPass) => {
            setNotification({ type: 'info', message: `New Library Pass Request from ${newPass.requester?.fullName || 'a user'}!` });
            setPasses(prev => [newPass, ...prev]);
        };

        socket.on('newLibraryPassRequest', handleNewPassRequest);

        return () => {
            socket.off('newLibraryPassRequest', handleNewPassRequest);
        };
    }, [fetchPendingPasses]);

    const handleDecision = async (passId, action) => {
        setProcessingId(passId);
        try {
            await api.put(`/api/library/librarypass/${action}/${passId}`);
            setPasses(prevPasses => prevPasses.filter(p => p._id !== passId));
            setNotification({ type: 'success', message: `Pass ${action}ed successfully.` });
        } catch (error) {
            console.error(`Failed to ${action} pass`, error);
            setNotification({ type: 'error', message: `Failed to ${action} pass.` });
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewImage = (imageUrl) => {
        setSelectedImage(imageUrl);
        setImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setImageModalOpen(false);
        setSelectedImage(null);
    };

    // Helper to get profile image URL safely
    const getProfileSrc = (requester) => {
        if (!requester) return null;
        const path = requester.profilePictureUrl || requester.profilePhoto;
        return path ? resolveProfileImageUrl(path) : null;
    };

    // Helper for Relative Time
    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    // --- Filtering Logic ---

    // 1. Get unique departments for the dropdown
    const availableDepts = [...new Set([
        'CT', 'MECH-A', 'MECH-B', 'CE', 'EEE', 'FS', 'AUTO',
        ...passes.map(p => p.requester?.department).filter(Boolean)
    ])].sort();

    // 2. Filter the passes based on Search Term AND Dropdowns
    const filteredPasses = passes.filter(pass => {
        const requester = pass.requester || {};
        const name = (requester.fullName || '').toLowerCase();
        const id = (requester.studentId || requester.employeeId || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        // Search Match
        const matchesSearch = name.includes(term) || id.includes(term);

        // Role Match
        let matchesRole = true;
        if (filterRole !== 'All') {
            matchesRole = pass.requesterModel === filterRole;
        }

        // Department Match
        let matchesDept = true;
        if (filterDept !== 'All') {
            matchesDept = requester.department === filterDept;
        }

        // Year Match (Only applies if user has a year, usually Students)
        let matchesYear = true;
        if (filterYear !== 'All') {
            matchesYear = String(requester.year) === String(filterYear);
        }

        return matchesSearch && matchesRole && matchesDept && matchesYear;
    });

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {notification && <Alert severity={notification.type} sx={{ mb: 2 }}>{notification.message}</Alert>}
            
            {/* Search and Filter Section */}
            <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="Search by Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                            <InputLabel>Role</InputLabel>
                            <Select value={filterRole} label="Role" onChange={(e) => {
                                setFilterRole(e.target.value);
                                if (e.target.value === 'Faculty') {
                                    setFilterYear('All');
                                }
                            }}>
                                <MenuItem value="All">All</MenuItem>
                                <MenuItem value="Student">Student</MenuItem>
                                <MenuItem value="Faculty">Faculty</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                            <InputLabel>Department</InputLabel>
                            <Select value={filterDept} label="Department" onChange={(e) => setFilterDept(e.target.value)}>
                                <MenuItem value="All">All</MenuItem>
                                {availableDepts.map(dept => (
                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                            <InputLabel>Year</InputLabel>
                            <Select 
                                value={filterYear} 
                                label="Year" 
                                onChange={(e) => setFilterYear(e.target.value)}
                                disabled={filterRole === 'Faculty'}
                            >
                                <MenuItem value="All">All</MenuItem>
                                {[1, 2, 3, 4].map(year => (
                                    <MenuItem key={year} value={year}>Year {year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : filteredPasses.length === 0 ? (
                <Alert severity="info">
                    {passes.length === 0 ? "No pending requests at the moment." : "No requests match your search filters."}
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {filteredPasses.map(item => (
                        <Grid item xs={12} md={6} lg={4} key={item._id}>
                            <Card elevation={3} sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                        <Avatar 
                                            src={getProfileSrc(item.requester)} 
                                            sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                                        >
                                            {item.requester?.fullName?.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
                                                {item.requester?.fullName || 'Unknown User'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {item.requester?.studentId || item.requester?.employeeId || 'No ID'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {item.requester?.department || 'N/A'} {item.requester?.year ? `| Year ${item.requester.year}` : ''}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Chip 
                                        icon={<AccessTime />} 
                                        label={`Requested: ${new Date(item.requestedAt).toLocaleDateString()}`} 
                                        size="small" 
                                        sx={{ mb: 2, bgcolor: '#f5f5f5' }} 
                                    />

                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        <strong>Request Type:</strong> {item.passType}
                                    </Typography>

                                    {item.passType === 'Book Borrow' && (
                                        <Box sx={{ mt: 1, mb: 2, p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px dashed #0ea5e9' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">{item.bookTitle}</Typography>
                                            <Typography variant="caption" display="block"><strong>Author:</strong> {item.bookAuthor}</Typography>
                                            <Typography variant="caption" display="block"><strong>ISBN:</strong> {item.bookISBN || 'N/A'} | <strong>Cat:</strong> {item.bookCategory}</Typography>
                                        </Box>
                                    )}

                                    {item.idProofPath ? (
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<Visibility />}
                                            onClick={() => handleViewImage(resolveProfileImageUrl(item.idProofPath))}
                                            sx={{ mt: 1, width: '100%' }}
                                        >
                                            View ID Proof
                                        </Button>
                                    ) : (
                                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                            No ID Proof Uploaded
                                        </Typography>
                                    )}
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircle />}
                                        onClick={() => handleDecision(item._id, 'approve')}
                                        disabled={!!processingId}
                                        sx={{ flex: 1, mr: 1 }}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<Cancel />}
                                        onClick={() => handleDecision(item._id, 'reject')}
                                        disabled={!!processingId}
                                        sx={{ flex: 1 }}
                                    >
                                        Reject
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Image Modal */}
            <Dialog open={imageModalOpen} onClose={handleCloseImageModal} maxWidth="md">
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    ID Proof Document
                    <IconButton onClick={handleCloseImageModal}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedImage && (
                        selectedImage.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={selectedImage} width="100%" height="500px" title="ID Proof PDF" style={{ border: 'none' }} />
                        ) : (
                            <img src={selectedImage} alt="ID Proof" style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }} />
                        )
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};


export default PendingPasses;
