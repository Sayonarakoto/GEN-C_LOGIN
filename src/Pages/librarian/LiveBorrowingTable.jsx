import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { socket } from '../../socket'; // Use the configured socket instance
import api from '../../api/client'; // Import api client

const LiveBorrowingTable = () => {
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [notification, setNotification] = useState(null);

    const fetchBorrowings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/library/borrowings');
            setBorrowings(response.data.data);
        } catch (error) {
            console.error('Failed to fetch borrowings', error);
            setNotification('Failed to fetch borrowings.');
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBorrowings();

        // Ensure socket is connected
        socket.connect();

        const handleNewBorrowing = (newRecord) => {
            setNotification(`New book issued: ${newRecord.bookTitle}`);
            setBorrowings(prev => [newRecord, ...prev]);
            setTimeout(() => setNotification(null), 3000);
        };

        socket.on('newBorrowing', handleNewBorrowing);

        return () => {
            socket.off('newBorrowing', handleNewBorrowing);
        };
    }, [fetchBorrowings]);
// ... rest of the file ...
    const handleSearch = (event) => {
        setSearchText(event.target.value);
    };
    
    const filteredBorrowings = borrowings.filter(
        (item) =>
            item.studentId?.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            item.studentId?.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
            item.bookTitle.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Live Borrowing Feed</Typography>
                {notification && <Alert severity="info" sx={{ mb: 2 }}>{notification}</Alert>}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        label="Search by student, ID or book"
                        variant="outlined"
                        value={searchText}
                        onChange={handleSearch}
                        sx={{ flexGrow: 1 }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student ID</TableCell>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Book Title</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBorrowings.map((row) => (
                                    <TableRow key={row._id}>
                                        <TableCell>{row.studentId?.studentId}</TableCell>
                                        <TableCell>{row.studentId?.fullName}</TableCell>
                                        <TableCell>{row.bookTitle}</TableCell>
                                        <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                color={row.status === 'Issued' ? 'primary' : 'error'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </LocalizationProvider>
    );
};


export default LiveBorrowingTable;