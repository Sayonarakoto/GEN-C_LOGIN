import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Image, Badge, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { CheckCircleOutline, Key, CalendarToday, Place, Comment, PersonPin, QrCode2, Send } from '@mui/icons-material';
import apiClient from '../api/client'; // Assuming apiClient is in this path

// --- Reusable Detail Row Component ---
const DetailRow = ({ icon, label, value, className = '' }) => (
    <div className={`d-flex justify-content-between align-items-center py-2 border-bottom ${className}`}>
        <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
            {icon}
            <span className="ms-2">{label}</span>
        </span>
        <span className="fw-bold text-end">{value}</span>
    </div>
);

// --- Gate Pass Request Form Component ---
const GatePassRequestForm = ({ onSubmit, loading, facultyList }) => {
    const [isHalfDay, setIsHalfDay] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        onSubmit(data);
    };

    return (
        <Card className="shadow-sm rounded-3 border-0">
            <Card.Header as="h5" className="bg-primary text-white d-flex align-items-center">
                <Send className="me-2" /> Request New Gate Pass
            </Card.Header>
            <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="destination">
                        <Form.Label>Destination</Form.Label>
                        <Form.Control type="text" name="destination" placeholder="e.g., City Hospital, Home" required />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="reason">
                        <Form.Label>Reason for Exit</Form.Label>
                        <Form.Control as="textarea" name="reason" rows={3} placeholder="e.g., Routine dental checkup" required />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="faculty-select">
                        <Form.Label>Select Approving Faculty/HOD</Form.Label>
                        <Form.Select name="facultyId" required>
                            <option value="">Select a faculty member...</option>
                            {facultyList.map(faculty => (
                                <option key={faculty._id} value={faculty._id}>{faculty.fullName} ({faculty.designation} - {faculty.department})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Check
                        type="switch"
                        id="half-day-check"
                        label="Half Day / Return Not Required"
                        className="mb-3 fs-5"
                        onChange={(e) => setIsHalfDay(e.target.checked)}
                    />

                    <Row>
                        <Col sm={6}>
                            <Form.Group className="mb-3" controlId="exit-time">
                                <Form.Label>Required Exit Time</Form.Label>
                                <Form.Control type="time" name="exitTime" required />
                            </Form.Group>
                        </Col>
                        {!isHalfDay && (
                            <Col sm={6}>
                                <Form.Group className="mb-3" controlId="return-time">
                                    <Form.Label>Expected Return Time</Form.Label>
                                    <Form.Control type="time" name="returnTime" />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>

                    <Button type="submit" variant="success" className="w-100 fw-bold p-2" disabled={loading}>
                        {loading ? 'Submitting...' : 'SUBMIT PASS REQUEST'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};


// --- Main Component ---
const StudentGatePass = () => {
    const [passData, setPassData] = useState(null);
    const [history, setHistory] = useState([]); // State for pass history
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [liveTime, setLiveTime] = useState(new Date());
    const [faculty, setFaculty] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);


    const fetchActiveGatePass = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const response = await apiClient.get('/api/gatepass/student/active');
            setPassData(response.data.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setPassData(null);
            } else {
                setError('Failed to fetch active gate pass.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/gatepass/student/history');
            setHistory(response.data.data);
        } catch (err) {
            console.error('Failed to fetch gate pass history:', err);
            // Non-critical error, so we don't show a full error screen
        }
    }, []);

    const fetchFaculty = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/faculty/all'); // Assuming this endpoint exists
            setFaculty(response.data.data);
        } catch (err) {
            console.error('Failed to fetch faculty:', err);
            setError('Could not load faculty list for the form.');
        }
    }, []);


    useEffect(() => {
        fetchActiveGatePass();
        fetchFaculty();
        fetchHistory();
    }, [fetchActiveGatePass, fetchFaculty, fetchHistory]);

    useEffect(() => {
        const timer = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRequestSubmit = async (formData) => {
        setSubmitLoading(true);
        setError('');
        try {
            // I need a new endpoint for this
            const response = await apiClient.post('/api/gatepass/student/request', formData);
            // After submitting, we should probably show a "pending" status, not an active pass.
            // For now, let's just refetch the active pass.
            fetchActiveGatePass();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit gate pass request.');
            console.error(err);
        } finally {
            setSubmitLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'OUT OF CAMPUS': return 'warning';
            case 'Rejected': return 'danger';
            case 'Pending': return 'info';
            default: return 'secondary';
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
                <p className="ms-3">Loading your gate pass status...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }}>
            <h1 className="h3 fw-bold text-center text-dark mb-4 d-flex align-items-center justify-content-center">
                <i className='bx bxs-institution text-primary me-3'></i> Gate Pass
            </h1>

            {passData ? (
                // --- Active Pass View ---
                <Card className="shadow-sm rounded-3 border-0">
                    <Card.Body className="p-4">
                        <div className={`w-100 text-center p-3 text-white rounded-3 mb-4 bg-${getStatusVariant(passData.status)}`}>
                            <CheckCircleOutline className="me-2" />
                            <span className="fw-bold fs-5">{passData.status}</span>
                        </div>
                        <Row>
                            <Col md={8} className="pe-md-4">
                                <div className="d-flex align-items-center mb-4 border-bottom pb-3">
                                    <Image src={passData.student_id?.photoUrl || 'https://placehold.co/64x64/3b82f6/ffffff?text=STUDENT'} alt="Student" roundedCircle style={{ width: '64px', height: '64px', border: '2px solid var(--bs-primary)' }} />
                                    <div className="ms-3">
                                        <p className="h5 fw-bold text-dark mb-0">{passData.student_id?.fullName}</p>
                                        <p className="text-muted mb-0">{passData.student_id?.studentId}</p>
                                    </div>
                                </div>
                                <div className="d-flex flex-column">
                                    <DetailRow icon={<Key fontSize="small" />} label="Pass ID:" value={<Badge bg="light" text="dark" className="fs-5 font-monospace">{passData._id.slice(-6)}</Badge>} />
                                    <DetailRow icon={<CalendarToday fontSize="small" />} label="Issued Date/Time:" value={new Date(passData.createdAt).toLocaleString()} />
                                    <DetailRow icon={<Place fontSize="small" />} label="Destination:" value={passData.destination} />
                                    <DetailRow icon={<Comment fontSize="small" />} label="Purpose:" value={passData.reason} />
                                    <DetailRow icon={<PersonPin fontSize="small" />} label="Approved By:" value={passData.faculty_id?.fullName || 'N/A'} className="border-bottom-0" />
                                </div>
                                <div className="mt-4 p-3 rounded-3 bg-success-subtle text-success-emphasis fw-bold text-center">
                                    <p className="fs-5 mb-0">Valid Until: {new Date(passData.date_valid_to).toLocaleString()}</p>
                                    <p className="small text-muted mt-1 mb-0">Live Timestamp: <span className="fw-medium">{liveTime.toLocaleTimeString()}</span></p>
                                </div>
                            </Col>
                            <Col md={4} className="d-flex flex-column align-items-center justify-content-center mt-4 mt-md-0">
                                <div className="p-2 bg-white border rounded-3 shadow-sm">
                                    {passData.qr_token ? (
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(passData.qr_token)}`} alt="QR Code" />
                                    ) : (
                                        <QrCode2 style={{ fontSize: '10rem' }} />
                                    )}
                                </div>
                                {passData.verification_otp && (
                                    <p className="text-muted small mt-2">OTP: <span className="fw-bold text-primary">{passData.verification_otp}</span></p>
                                )}
                                <p className="text-muted small mt-2">Scan at security checkpoint</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ) : (
                // --- Form View ---
                <GatePassRequestForm onSubmit={handleRequestSubmit} loading={submitLoading} facultyList={faculty} />
            )}
            
            <GatePassHistory history={history} />
        </div>
    );
};

// --- Gate Pass History Component ---
const GatePassHistory = ({ history }) => {
    if (history.length === 0) {
        return null; // Don't render anything if there's no history
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Used': return 'secondary';
            case 'Expired': return 'dark';
            case 'Rejected': return 'danger';
            case 'Pending': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <div className="mt-5">
            <h2 className="h4 fw-bold text-dark mb-3">Gate Pass History</h2>
            {history.map(pass => (
                <Card key={pass._id} className="mb-3 shadow-sm rounded-3 border-0">
                    <Card.Body>
                        <Row>
                            <Col sm={8}>
                                <p className="h5 fw-bold text-dark mb-1">{pass.destination}</p>
                                <p className="text-muted small mb-2">{new Date(pass.createdAt).toLocaleString()}</p>
                                <p className="mb-0"><strong>Reason:</strong> {pass.reason}</p>
                                <p><strong>Approved By:</strong> {pass.faculty_id?.fullName || 'N/A'}</p>
                            </Col>
                            <Col sm={4} className="text-sm-end">
                                <Badge bg={getStatusVariant(pass.status)} className="fs-6">{pass.status}</Badge>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default StudentGatePass;