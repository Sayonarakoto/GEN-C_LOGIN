import React, { useState, useEffect, useCallback } from 'react';
import {
    AppBar, Toolbar, Typography, Button, IconButton, Box, Container,
    Card, CardContent, Grid, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, Chip, Stack, Paper, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // For PDF download
import { Table } from 'react-bootstrap'; // Using React-Bootstrap Table
import apiClient from '../api/client'; // Assuming you have an axios client setup
import useToastService from '../hooks/useToastService'; // Import the toast service
import { format } from 'date-fns'; // For date formatting

// Styled components (translating some Tailwind to MUI styled or sx prop)
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper, // Use paper background for light/dark mode
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
}));

const StyledCard = styled(Card)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    boxShadow: 'none',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: theme.shape.borderRadius,
}));

const FacultyGatePass = () => {
    const theme = useTheme();
    const toast = useToastService();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterParams, setFilterParams] = useState({
        from: '',
        to: '',
        statusFilter: '',
    });

    const fetchPendingRequests = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/gatepass/faculty/pending');
            if (response.data.success) {
                setPendingRequests(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to fetch pending requests.');
            }
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            toast.error('Error fetching pending requests.');
        }
    }, [toast]);

    const fetchHistory = useCallback(async (params = {}) => {
        try {
            const queryParams = { ...params };
            if (queryParams.statusFilter === '') {
                delete queryParams.statusFilter;
            }
            const response = await apiClient.get('/api/gatepass/faculty/history', { params: queryParams });
            if (response.data.success) {
                setHistory(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to fetch gate pass history.');
            }
        } catch (error) {
            console.error('Error fetching gate pass history:', error);
            toast.error('Error fetching gate pass history.');
        }
    }, [toast]);

    useEffect(() => {
        fetchPendingRequests();
        fetchHistory(filterParams); // Pass filterParams to fetchHistory
    }, [fetchPendingRequests, fetchHistory, filterParams]); // Add filterParams to dependency array

    const handleFilterChange = (event) => {
        setFilterParams({
            ...filterParams,
            [event.target.name]: event.target.value,
        });
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        fetchHistory(filterParams);
    };

    const handleClearFilters = () => {
        setFilterParams({
            from: '',
            to: '',
            statusFilter: '',
        });
        fetchHistory({}); // Fetch all history
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedRequest(null);
    };

    const handleApproveReject = async (id, status) => {
        try {
            const endpoint = status === 'approved' ? `/api/gatepass/faculty/approve/${id}` : `/api/gatepass/faculty/reject/${id}`;
            const response = await apiClient.put(endpoint);
            if (response.data.success) {
                toast.success(`Gate pass ${status} successfully!`);
                fetchPendingRequests(); // Refresh pending requests
                fetchHistory(filterParams); // Refresh history with current filters
            } else {
                toast.error(response.data.message || `Failed to ${status} gate pass.`);
            }
        } catch (error) {
            console.error(`Error ${status} gate pass:`, error);
            toast.error(`Error ${status} gate pass.`);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            // Assuming an API endpoint for PDF generation that accepts filterParams
            const response = await apiClient.get('/api/gatepass/faculty/history/pdf', {
                responseType: 'blob', // Important for downloading files
                params: filterParams, // Pass current filters to PDF download
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `gatepass_history_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Gate pass history downloaded as PDF.');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF.');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <StyledAppBar position="sticky">
                <Toolbar sx={{ justifyContent: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center', color: 'text.primary' }}>
                        Gate Pass Management
                    </Typography>
                </Toolbar>
            </StyledAppBar>

            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                {/* Pending Requests Section */}
                <Card sx={{ mb: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
                        Pending Requests
                    </Typography>
                    <Stack spacing={2}>
                        {pendingRequests.map((request) => (
                            <StyledCard key={request._id}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="flex-start">
                                        <Grid item xs={8}>
                                            <Typography variant="subtitle1" component="p" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                                {request.studentName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                <Box component="span" sx={{ fontWeight: 'medium' }}>Out:</Box> {format(new Date(request.date_valid_from), 'hh:mm a')} • <Box component="span'" sx={{ fontWeight: 'medium' }}>Return:</Box> {format(new Date(request.date_valid_to), 'hh:mm a')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <Box component="span" sx={{ fontWeight: 'medium' }}>Reason:</Box> {request.request_reason}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                fullWidth
                                                onClick={() => handleApproveReject(request._id, 'approved')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                fullWidth
                                                onClick={() => handleApproveReject(request._id, 'rejected')}
                                            >
                                                Reject
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Button
                                        variant="text"
                                        fullWidth
                                        sx={{ mt: 2, color: 'text.secondary', bgcolor: 'action.hover' }}
                                        onClick={() => handleViewDetails(request)}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </StyledCard>
                        ))}
                        {pendingRequests.length === 0 && (
                            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                No pending requests.
                            </Typography>
                        )}
                    </Stack>
                </Card>

                {/* History Section */}
                <Card sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" component="h2" sx={{ color: 'text.primary' }}>
                            History
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="form" onSubmit={handleApplyFilters} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="From Date"
                                    type="date"
                                    name="from"
                                    value={filterParams.from}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                                <TextField
                                    label="To Date"
                                    type="date"
                                    name="to"
                                    value={filterParams.to}
                                    onChange={handleFilterChange}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="statusFilter"
                                        value={filterParams.statusFilter}
                                        label="Status"
                                        onChange={handleFilterChange}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="Approved">Approved</MenuItem>
                                        <MenuItem value="Rejected">Rejected</MenuItem>
                                        <MenuItem value="Pending">Pending</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button variant="contained" type="submit">Filter</Button>
                                <Button variant="outlined" onClick={handleClearFilters}>Clear</Button>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={handleDownloadPdf}
                                sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                            >
                                Download as PDF
                            </Button>
                        </Stack>
                    </Box>

                    {/* Using React-Bootstrap Table for history */}
                    <Table striped bordered hover variant="light" responsive>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Out Time</th>
                                <th>Return Time</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Approved At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.studentName}</td>
                                    <td>{format(new Date(item.date_valid_from), 'hh:mm a')}</td>
                                    <td>{format(new Date(item.date_valid_to), 'hh:mm a')}</td>
                                    <td>{item.request_reason}</td>
                                    <td>
                                        <Chip
                                            label={item.status}
                                            color={item.status === 'Approved' ? 'success' : (item.status === 'Rejected' ? 'error' : 'default')}
                                            size="small"
                                        />
                                    </td>
                                    <td>{item.approved_at ? format(new Date(item.approved_at), 'yyyy-MM-dd hh:mm a') : 'N/A'}</td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center' }}>No history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </Container>

            {/* Request Details Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', pb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Request Details</Typography>
                        <IconButton onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: 'background.paper', color: 'text.secondary' }}>
                    {selectedRequest && (
                        <Stack spacing={2}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Student Name</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{selectedRequest.studentName}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Student ID</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{selectedRequest.studentId}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Contact Number</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{selectedRequest.contactNumber}</Typography>
                            </Box>
                            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', my: 1 }} />
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Out Time</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{format(new Date(selectedRequest.date_valid_from), 'hh:mm a')}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Return Time</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{format(new Date(selectedRequest.date_valid_to), 'hh:mm a')}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Reason</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary', mt: 0.5 }}>
                                    {selectedRequest.request_reason}
                                </Typography>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'background.paper', p: 2, display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ flexGrow: 1 }}
                        onClick={() => { handleApproveReject(selectedRequest._id, 'rejected'); handleCloseModal(); }}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ flexGrow: 1 }}
                        onClick={() => { handleApproveReject(selectedRequest._id, 'approved'); handleCloseModal(); }}
                    >
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FacultyGatePass;