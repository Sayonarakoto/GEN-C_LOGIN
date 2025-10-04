import React, { useState, useEffect } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { useTheme } from '../hooks/useTheme';
import useToastService from '../hooks/useToastService';

export default function StudentLateEntryForm({ entryData, onSubmit, loading: formLoading }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const toast = useToastService();

  const [reason, setReason] = useState(entryData?.reason || "");
  const [facultyId, setFacultyId] = useState(entryData?.facultyId?._id || "");
  const [date, setDate] = useState(entryData?.date ? new Date(entryData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [escalate, setEscalate] = useState(entryData?.requiresHODApproval || false);
  
  const [facultyList, setFacultyList] = useState([]);
  const [hodId, setHodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const themeColors = {
    card: theme === 'dark' ? 'var(--card-bg)' : '#fff',
    txt: theme === 'dark' ? 'var(--text-primary)' : '#0c151d',
    inputBg: theme === 'dark' ? 'var(--bg-secondary)' : '#f8fafc',
    inputColor: theme === 'dark' ? 'var(--text-primary)' : '#0c151d',
    inputBorder: theme === 'dark' ? 'var(--border-color)' : '#cddcea',
  };

  useEffect(() => {
    const fetchRequiredData = async () => {
        if (!user || !user.department) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Faculty List
            console.log(`Fetching faculty for department: ${user.department}`);
            const facultyResponse = await api.get(`/api/faculty/by-department/${user.department}`);
            // Map the response to the format needed for MenuItem (value=ID, label=Name)
            setFacultyList(facultyResponse.data.data.map(f => ({ value: f._id, label: f.fullName })));
            console.log("Faculty fetched successfully.");

            // 2. Fetch HOD ID (Requires a new backend route: /api/hod/by-department/:dept)
            console.log(`Fetching HOD for department: ${user.department}`);
            const hodResponse = await api.get(`/api/faculty/hod/by-department/${user.department}`);
            if (hodResponse.data.data && hodResponse.data.data._id) {
                setHodId(hodResponse.data.data._id); // Assume response returns the HOD document/ID
            }

        } catch (error) {
            console.error("Failed to fetch required data:", error);
            toast.error("Failed to load required data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    fetchRequiredData();
  }, [user, toast]);

  const handleSubmit = async () => {
    if (!reason || !facultyId || !date) { // Added date validation
        toast.error("Please provide a reason, select a faculty member, and a date.");
        return;
    }
    
    setSubmitting(true);

    const formData = {
        reason,
        facultyId,
        date, // Include date in the payload
        HODId: escalate && hodId ? hodId : null,
    };

    // Call the onSubmit prop from the parent component
    await onSubmit(formData);
    setSubmitting(false); // Set submitting to false after onSubmit completes
  };

  return (
    <Card style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.inputBorder}` }} className="shadow-sm">
      <Card.Body style={{ padding: '2rem' }}>
        <Card.Title as="h4" style={{ fontWeight: 'bold', color: themeColors.txt }}>
          Student Late Entry Form
        </Card.Title>
        
        <Form className="mt-4">
            {/* Date Input */}
            <Form.Group className="mb-3">
                <Form.Label className="fw-medium" style={{ color: themeColors.txt }}>Date of Late Entry</Form.Label>
                <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.inputColor,
                        borderColor: themeColors.inputBorder,
                    }}
                />
            </Form.Group>

            {/* Faculty Select */}
            <Form.Group className="mb-3">
                <Form.Label className="fw-medium" style={{ color: themeColors.txt }}>Faculty</Form.Label>
                <Form.Select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    disabled={loading}
                    style={{
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.inputColor,
                        borderColor: themeColors.inputBorder,
                    }}
                >
                    {loading && <option value="">Loading...</option>}
                    {!loading && <option value="">Select a faculty member</option>}
                    
                    {facultyList.map((opt) => (
                        <option value={opt.value} key={opt.value}>
                            {opt.label}
                        </option>))}
                </Form.Select>
            </Form.Group>

            {/* Reason Textarea */}
            <Form.Group className="mb-3">
                <Form.Label className="fw-medium" style={{ color: themeColors.txt }}>Reason</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Enter detailed reason for your late entry"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    style={{
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.inputColor,borderColor: themeColors.inputBorder,
                    }}
                />
            </Form.Group>

            {/* Escalate To HOD */}
            <Form.Group className="mb-3">
                <Form.Check 
                    type="checkbox"
                    id="escalate-checkbox"
                    label="Escalate to HOD for Priority Review (Mandatory Hold)"
                    checked={escalate}
                    onChange={() => setEscalate((prev) => !prev)}
                    disabled={loading || !hodId || !facultyId}
                    style={{ color: themeColors.txt }}
                />
                <Form.Text className="text-muted">
                    Select this only for urgent cases. Your request will be held until the HOD reviews it.
                </Form.Text>
            </Form.Group>

            {/* Submit Button */}
            <div className="d-grid gap-2" style={{ marginTop: 20 }}>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit} 
                    disabled={submitting || loading || !reason || !facultyId}
                >
                    {submitting ? <><Spinner as="span" size="sm" /> Submitting...</> : 'Submit'}
                </Button>
            </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
