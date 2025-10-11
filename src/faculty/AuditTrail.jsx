import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
  TablePagination,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Radio
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';

const AuditTrail = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null); // New state
  const [reportData, setReportData] = useState({ specialPasses: [], lateEntries: [], gatePasses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = useCallback(async () => {
    if (!user?.department) return;

    setLoading(true);
    try {
      const response = await apiClient.get('/api/faculty/students', {
        params: {
          department: user.department,
          search: searchQuery,
          page: currentPage,
          limit: studentsPerPage,
        },
      });
      setStudents(response.data.students);
      setTotalStudents(response.data.totalStudents);
    } catch (err) {
      setError('Failed to fetch student data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.department, searchQuery, currentPage, studentsPerPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDateChange = (name, date) => {
    setFilters((prev) => ({ ...prev, [name]: date }));
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student._id);
    setSelectedStudentDetails(student);
  };

  const handleFetchReport = async () => {
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : null,
        endDate: filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : null,
      };
      const response = await apiClient.get(`/api/students/${selectedStudent}/activity-report`, { params });
      setReportData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch activity report:", err);
      setError('Failed to load activity report.');
      setReportData({ specialPasses: [], lateEntries: [], gatePasses: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Activity Report
        </Typography>

        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>Select Student and Date Range</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search Students"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Stack>

          {selectedStudentDetails && (
            <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Selected Student:</Typography>
              <Typography>Name: {selectedStudentDetails.fullName}</Typography>
              <Typography>Student ID: {selectedStudentDetails.studentId}</Typography>
              <Typography>Department: {selectedStudentDetails.department}</Typography>
              <Typography>Year: {selectedStudentDetails.year}</Typography>
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Year</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={5} align="center"><Typography color="error">{error}</Typography></TableCell></TableRow>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell padding="checkbox">
                        <Radio
                          checked={selectedStudent === student._id}
                          onChange={() => handleStudentSelect(student)}
                        />
                      </TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.year}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} align="center">No students found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalStudents}
            page={currentPage - 1}
            onPageChange={(event, newPage) => setCurrentPage(newPage + 1)}
            rowsPerPage={studentsPerPage}
            rowsPerPageOptions={[5]}
            onRowsPerPageChange={() => {}}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 3 }}>
            <DatePicker
              label="From Date"
              value={filters.startDate}
              onChange={(date) => handleDateChange('startDate', date)}
              slotProps={{
                textField: ({ $typeof, ...params }) => <TextField {...params} />,
              }}
            />
            <DatePicker
              label="To Date"
              value={filters.endDate}
              onChange={(date) => handleDateChange('endDate', date)}
              slotProps={{
                textField: ({ $typeof, ...params }) => <TextField {...params} />,
              }}
            />
            <Button variant="contained" onClick={handleFetchReport}>Fetch Report</Button>
          </Stack>

          {reportData && (
            <Box>
              <Typography variant="h6" gutterBottom>Approved Special Passes</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pass Type</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Approved By</TableCell>
                      <TableCell>Approved At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.specialPasses.length > 0 ? (
                      reportData.specialPasses.map((pass) => (
                        <TableRow key={pass._id}>
                          <TableCell>{pass.pass_type}</TableCell>
                          <TableCell>{pass.request_reason}</TableCell>
                          <TableCell>{pass.hod_approver_id?.fullName || 'N/A'}</TableCell>
                          <TableCell>{new Date(pass.approved_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No approved special passes found for the selected period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom>Late Entries</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Faculty</TableCell>
                      <TableCell>HOD</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.lateEntries.length > 0 ? (
                      reportData.lateEntries.map((entry) => (
                        <TableRow key={entry._id}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.reason}</TableCell>
                          <TableCell>{entry.status}</TableCell>
                          <TableCell>{entry.facultyId?.fullName || 'N/A'}</TableCell>
                          <TableCell>{entry.HODId?.fullName || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No late entries found for the selected period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom>Gate Passes</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Destination</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Faculty Status</TableCell>
                      <TableCell>HOD Status</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.gatePasses.length > 0 ? (
                      reportData.gatePasses.map((pass) => (
                        <TableRow key={pass._id}>
                          <TableCell>{pass.destination}</TableCell>
                          <TableCell>{pass.reason}</TableCell>
                          <TableCell>{pass.faculty_status}</TableCell>
                          <TableCell>{pass.hod_status}</TableCell>
                          <TableCell>{new Date(pass.date_valid_from).toLocaleString()}</TableCell>
                          <TableCell>{new Date(pass.date_valid_to).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No gate passes found for the selected period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default AuditTrail;