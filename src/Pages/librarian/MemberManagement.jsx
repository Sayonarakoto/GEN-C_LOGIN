import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Button,
    Stack
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '../../api/client';
import MemberProfileModal from './MemberProfileModal'; // This will be the new modal component

const MemberManagement = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/library/members');
            setMembers(response.data.data);
        } catch (err) {
            setError('Failed to fetch library members.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleViewProfile = (member) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMember(null);
        fetchMembers(); // Re-fetch members in case a card was deactivated
    };

    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            if (!member) return false;
            const term = searchTerm.toLowerCase();
            const name = (member.fullName || '').toLowerCase();
            const id = (member.studentId || member.employeeId || '').toLowerCase();
            return name.includes(term) || id.includes(term);
        });
    }, [members, searchTerm]);

    const getProfileSrc = (member) => {
        if (!member) return null;
        const path = member.profilePictureUrl || member.profilePhoto;
        if (!path) return null;
        const normalized = path.replace(/\\/g, '/').replace('/static/uploads', '/uploads');
        return `http://localhost:3001${normalized.startsWith('/') ? '' : '/'}${normalized}`;
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Library Member Management
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by Name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMembers.length > 0 ? filteredMembers.map(member => (
                            <TableRow key={member._id} hover>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar src={getProfileSrc(member)} alt={member.fullName}>
                                            {member.fullName?.charAt(0)}
                                        </Avatar>
                                        <Typography variant="body2" fontWeight="medium">{member.fullName}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>{member.studentId || member.employeeId}</TableCell>
                                <TableCell>{member.department}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{member.role}</TableCell>
                                <TableCell align="right">
                                    <Button variant="outlined" size="small" onClick={() => handleViewProfile(member)}>
                                        View Profile
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedMember && (
                <MemberProfileModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    userId={selectedMember._id}
                />
            )}
        </Box>
    );
};

export default MemberManagement;