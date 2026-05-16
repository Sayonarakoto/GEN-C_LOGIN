import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import useToastService from '../hooks/useToastService';

const BookBorrowRequest = () => {
    const { user } = useAuth();
    const toast = useToastService();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        bookTitle: '',
        bookAuthor: '',
        bookISBN: '',
        bookCategory: '',
        borrowDuration: '14',
    });

    useEffect(() => {
        const checkLibraryStatus = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const response = await api.get(`/api/library/status/${user.id}`);
                if (response.data.success && response.data.data) {
                    // Case-insensitive check for 'Approved' status
                    setStatus(response.data.data.status.toLowerCase());
                } else {
                    setStatus('not_found');
                }
            } catch (err) {
                setError('Failed to fetch library ID status.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkLibraryStatus();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/library/request-borrow', formData);
            if (response.data.success) {
                toast.success('Book borrow request submitted successfully!');
                setFormData({
                    bookTitle: '',
                    bookAuthor: '',
                    bookISBN: '',
                    bookCategory: '',
                    borrowDuration: '14',
                });
            } else {
                toast.error(response.data.message || 'Failed to submit request.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred.');
            console.error(err);
        }
    };

    if (loading) {
        return <Spinner animation="border" className="d-block mx-auto" />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    // If status is not 'approved', show the locked view
    if (status !== 'approved') {
        return (
            <Card className="text-center p-4">
                <Card.Body>
                    <Card.Title>Library Access Required</Card.Title>
                    {status === 'pending' && <Card.Text>Your request for a Digital Library ID is currently pending approval.</Card.Text>}
                    {status === 'rejected' && <Card.Text>Your request for a Digital Library ID was rejected. Please contact the librarian or submit a new request.</Card.Text>}
                    {(status === 'not_found' || !status) && <Card.Text>You need an active Digital Library ID to borrow books.</Card.Text>}
                    <Button as={NavLink} to="/student/library-activation">Activate Your Library ID</Button>
                </Card.Body>
            </Card>
        );
    }

    // Otherwise, show the borrow form
    return (
        <Card>
            <Card.Header as="h5">Request to Borrow a Book</Card.Header>
            <Card.Body>
                <Card.Text>
                    If the book you want is not in our inventory, you can request it here.
                    Upon approval, the book will be added to our inventory and issued to you.
                </Card.Text>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="bookTitle">
                        <Form.Label>Book Title</Form.Label>
                        <Form.Control type="text" name="bookTitle" value={formData.bookTitle} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="bookAuthor">
                        <Form.Label>Author</Form.Label>
                        <Form.Control type="text" name="bookAuthor" value={formData.bookAuthor} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="bookISBN">
                        <Form.Label>ISBN (Optional)</Form.Label>
                        <Form.Control type="text" name="bookISBN" value={formData.bookISBN} onChange={handleInputChange} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="bookCategory">
                        <Form.Label>Category</Form.Label>
                        <Form.Control type="text" name="bookCategory" value={formData.bookCategory} onChange={handleInputChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="borrowDuration">
                        <Form.Label>Borrow Duration (Days)</Form.Label>
                        <Form.Control as="select" name="borrowDuration" value={formData.borrowDuration} onChange={handleInputChange}>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="21">21 Days</option>
                        </Form.Control>
                    </Form.Group>
                    <Button variant="primary" type="submit">Submit Request</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default BookBorrowRequest;