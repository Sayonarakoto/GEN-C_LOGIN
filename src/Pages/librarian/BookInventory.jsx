import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, TextField, InputAdornment, CircularProgress, Button, IconButton, Dialog, DialogTitle, TablePagination,
    DialogContent, DialogActions, Grid, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { Search, Add, Delete } from '@mui/icons-material';
import api from '../../api/client';
import useToastService from '../../hooks/useToastService';

const BookInventory = () => {
    const toast = useToastService();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalBooks, setTotalBooks] = useState(0);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        isbn: '',
        category: '',
        totalCopies: 1
    });

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const res = await api.get('/library/books', {
                    params: {
                        page: page + 1, // API expects 1-based index
                        limit: rowsPerPage,
                        search: searchTerm,
                        sortBy: sortBy
                    }
                });
                if (res.data.success) {
                    setBooks(res.data.data);
                    setTotalBooks(res.data.total || 0);
                }
            } catch (error) {
                console.error("Failed to fetch books", error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchBooks();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [page, rowsPerPage, searchTerm, sortBy]);

    const handleAddBook = async () => {
        try {
            const res = await api.post('/library/books', newBook);
            if (res.data.success) {
                setBooks([res.data.data, ...books].slice(0, rowsPerPage));
                setTotalBooks(prev => prev + 1);
                setOpenAddDialog(false);
                setNewBook({ title: '', author: '', isbn: '', category: '', totalCopies: 1 });
                toast.success('Book added successfully');
            }
        } catch (error) {
            toast.error('Failed to add book');
        }
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Are you sure you want to delete this book?')) return;
        try {
            await api.delete(`/api/library/books/${id}`);
            setBooks(books.filter(b => b._id !== id));
            setTotalBooks(prev => prev - 1);
            toast.success('Book deleted');
        } catch (error) {
            toast.error('Failed to delete book');
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const categories = ['Textbook', 'Fiction', 'Science', 'Technology', 'History', 'Arts', 'Other'];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" fontWeight="bold">Book Inventory</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        size="small"
                        onClick={() => setOpenAddDialog(true)}
                    >
                        Add Book
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white', borderRadius: 1 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label="Sort By"
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="createdAt">Newest</MenuItem>
                            <MenuItem value="title">Title</MenuItem>
                            <MenuItem value="author">Author</MenuItem>
                            <MenuItem value="availability">Availability</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder="Search by Title, Author, ISBN..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0); // Reset to first page on search
                        }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                        }}
                        sx={{ bgcolor: 'white', minWidth: 300 }}
                    />
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Author</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>ISBN</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Copies (Total/Avail)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {books.length > 0 ? books.map((book) => (
                                <TableRow key={book._id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{book.title}</TableCell>
                                    <TableCell>{book.author || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <Chip label={book.category || 'General'} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{book.isbn || 'N/A'}</TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={`${book.totalCopies} / ${book.availableCopies}`} 
                                            color={book.availableCopies > 0 ? "success" : "error"} 
                                            size="small" 
                                            variant="filled"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteBook(book._id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No books found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalBooks}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth label="Title" 
                                value={newBook.title} 
                                onChange={(e) => setNewBook({...newBook, title: e.target.value})} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth label="Author" 
                                value={newBook.author} 
                                onChange={(e) => setNewBook({...newBook, author: e.target.value})} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth label="ISBN" 
                                value={newBook.isbn} 
                                onChange={(e) => setNewBook({...newBook, isbn: e.target.value})} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth label="Category" value={newBook.category} onChange={(e) => setNewBook({...newBook, category: e.target.value})}>
                                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth type="number" label="Total Copies" 
                                value={newBook.totalCopies} 
                                onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})} 
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddBook} variant="contained">Add Book</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BookInventory;