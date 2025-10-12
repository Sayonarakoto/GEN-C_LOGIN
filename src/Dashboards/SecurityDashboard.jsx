import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Modal,
} from "@mui/material";
import { Row, Col } from 'react-bootstrap';
import { QrCodeScanner, Lock, CheckCircle, Cancel, Logout, Schedule } from "@mui/icons-material";
import apiClient from "../api/client";
import { useAuth } from "../hooks/useAuth";
import SecurityScanner from "../components/SecurityScanner"; // Import the SecurityScanner

const LiveLogTable = ({ logs, loading }) => {
  // ... (This component remains unchanged)
  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
      <Typography variant="h5" fontWeight={600} mb={2} color="#1F2937">
        Today's Check-Ins
      </Typography>
      <TableContainer>
        <Table>
                    <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Pass Type</TableCell>
              <TableCell>Start Time</TableCell> {/* New column */}
              <TableCell>End Time</TableCell>   {/* New column */}
              <TableCell align="right">CheckoutTime</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : Array.isArray(logs) && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell component="th" scope="row">{log.event_details?.student_name || 'N/A'}</TableCell><TableCell>{log.event_details?.pass_type || 'N/A'}</TableCell><TableCell>
                    {log.event_details?.pass_start_time
                      ? new Date(log.event_details.pass_start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : 'N/A'}
                  </TableCell><TableCell>
                    {log.event_details?.pass_end_time
                      ? new Date(log.event_details.pass_end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : 'N/A'}
                  </TableCell><TableCell align="right">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No check-ins recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function SecurityDashboard() {
  const { logout } = useAuth();
  const [time, setTime] = useState(new Date());

  // Verification Form State
  const [otp, setOtp] = useState("");
  const [studentId, setStudentId] = useState(""); // New state for student ID
  const [verificationResult, setVerificationResult] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false); // State for scanner modal
  const [scannedToken, setScannedToken] = useState(""); // Temporary state to hold the scanned token
  const [passVerificationType, setPassVerificationType] = useState('special'); // 'special' or 'gate'

  // Live Log State
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);

  // Create a memoized version of the unique logs to prevent duplicates in the view
  const uniqueLogs = useMemo(() => {
    const uniqueMap = logs.reduce((map, log) => {
      // Use pass_id for uniqueness, otherwise fall back to _id for logs without it
      const key = log.pass_id || log._id;
      const existing = map.get(key);
      // Keep only the newest log entry for each pass
      if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
        map.set(key, log);
      }
      return map;
    }, new Map());
    
    const sortedUniqueLogs = Array.from(uniqueMap.values());
    // Sort the final array by timestamp to show the most recent check-ins first
    sortedUniqueLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sortedUniqueLogs;
  }, [logs]);


  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const headerColor = verificationResult
    ? verificationResult.is_valid
      ? "#10B981"
      : "#EF4444"
    : "#3B82F6";
  const backgroundColor = verificationResult
    ? verificationResult.is_valid
      ? "#D1FAE5"
      : "#FEE2E2"
    : "#F3F4F6";

  const fetchLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const response = await apiClient.get("/api/security/logs"); // Correct endpoint
      if (response.data && response.data.success) {
        setLogs(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch live logs:", error);
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs().finally(() => setLogLoading(false));
    const intervalId = setInterval(fetchLogs, 60000);
    return () => clearInterval(intervalId);
  }, [fetchLogs]);

  const handleVerification = async (token = null) => {
    setFormLoading(true);
    setVerificationResult(null);

    const tokenToUse = token || scannedToken; // Prioritize token passed directly (from scan)

    const payload = {};
    let endpoint;

    if (passVerificationType === 'special') {
        payload.qr_token = tokenToUse;
        endpoint = "/api/special-passes/verify";
    } else if (passVerificationType === 'gate') {
        if (tokenToUse) {
            payload.qr_token = tokenToUse;
            endpoint = "/api/gatepass/verify-qr"; // Assuming a different endpoint for QR verification of gate passes
        } else {
            payload.studentIdString = studentId;
            payload.otp = otp;
            endpoint = "/api/gatepass/verify-otp";
        }
    } else {
        setFormLoading(false);
        setVerificationResult({
            is_valid: false,
            display_status: "INPUT REQUIRED",
            error_message: "Please select a pass type (Special or Gate) before verification.",
        });
        return; // No valid pass type selected
    }
    
    // Reset scanned token after preparing payload
    setScannedToken("");

    console.log("Sending verification request:", { endpoint, payload }); // Debug log

    try {
      const result = await apiClient.post(endpoint, payload);
      console.log("Verification response:", result.data); // Debug log
      setVerificationResult(result.data);
      if (result.data.is_valid) {
        // Re-fetch the logs from the database to get the new entry
        fetchLogs();
      }
    } catch (error) {
      console.error("Verification error:", error); // Debug log
      setVerificationResult({
        is_valid: false,
        display_status: "VERIFICATION FAILED",
        error_message: error.response?.data?.message || "An error occurred during verification.",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    // Directly call handleVerification with the decoded token
    handleVerification(decodedText);
  };

  const resetVerification = () => {
    setOtp("");
    setStudentId(""); // Reset student ID
    setScannedToken("");
    setVerificationResult(null);
  };

  const isManualInputValid = studentId.length > 0 && otp.length === 3;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: backgroundColor, transition: "background-color 0.5s", p: { xs: 1, md: 3 } }}>
      <Modal open={showScanner} onClose={() => setShowScanner(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" mb={2}>Scan Pass QR Code</Typography>
          <SecurityScanner onScanSuccess={handleScanSuccess} />
          <Button onClick={() => setShowScanner(false)} sx={{ mt: 2 }} fullWidth>Cancel Scan</Button>
        </Box>
      </Modal>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: headerColor, p: 2, color: "#fff", borderRadius: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ flexGrow: 1, textAlign: 'center' }}>
          {verificationResult?.display_status || "AWAITING SCAN/INPUT"}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.1)', p: '4px 12px', borderRadius: '12px' }}>
                <Schedule sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={500}>{time.toLocaleTimeString()}</Typography>
            </Box>
            <IconButton onClick={logout} sx={{ color: 'white' }} aria-label="logout">
                <Logout sx={{ fontSize: 32 }} />
            </IconButton>
        </Box>
      </Box>

      <Row className="g-4">
        <Col xs={12} lg={7}>
          <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={600} mb={3} color="#1F2937">
              Verify Pass
            </Typography>

            {/* Pass Type Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} mb={1}>Select Pass Type:</Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant={passVerificationType === 'special' ? 'contained' : 'outlined'}
                  onClick={() => setPassVerificationType('special')}
                  disabled={formLoading}
                >
                  Special Pass
                </Button>
                <Button
                  variant={passVerificationType === 'gate' ? 'contained' : 'outlined'}
                  onClick={() => setPassVerificationType('gate')}
                  disabled={formLoading}
                >
                  Gate Pass
                </Button>
              </Stack>
            </Box>
            
            {/* QR CODE SCANNER SECTION */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={500}>
                <QrCodeScanner sx={{ mr: 1, color: headerColor, verticalAlign: 'middle' }} /> QR Code Scan
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => {
                    resetVerification(); // Clear any existing input before scanning
                    setShowScanner(true);
                }}
                disabled={formLoading}
              >
                Open Scanner
              </Button>
            </Box>
            
            <Typography textAlign="center" variant="overline" display="block" mb={3}>
              — OR MANUAL OTP —
            </Typography>
            
            {/* MANUAL OTP INPUT SECTION */}
            <Typography variant="h6" fontWeight={500} mb={1}>
              <Lock sx={{ mr: 1, color: headerColor, verticalAlign: 'middle' }} /> Enter Student ID & OTP
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
              <TextField
                fullWidth
                label="Student ID"
                value={studentId}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setStudentId(val);
                  setScannedToken("");
                }}
                type="text"
                disabled={formLoading}
              />
              <TextField
                fullWidth
                label="3-Digit OTP"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 3) {
                    setOtp(val);
                    setScannedToken("");
                  }
                }}
                type="password"
                inputProps={{ maxLength: 3 }}
                disabled={formLoading}
              />
            </Stack>
            <Stack direction="row" spacing={2} mt={4}>
              <Button
                variant="contained"
                onClick={() => handleVerification()} // No token passed, relies on OTP state
                disabled={formLoading || !isManualInputValid}
                sx={{
                  py: 1.5,
                  flexGrow: 1,
                  bgcolor: headerColor,
                  "&:hover": { bgcolor: headerColor },
                }}
              >
                {formLoading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "VERIFY & LOG"}
              </Button>
              <Button variant="outlined" onClick={resetVerification} disabled={formLoading}>
                Reset
              </Button>
            </Stack>
            
            {/* VERIFICATION RESULT DISPLAY */}
            {verificationResult && (
              <Box mt={4}>
                {verificationResult.is_valid ? (
                  <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                    Verification Successful. Audit Log updated.
                  </Alert>
                ) : (
                  <Alert icon={<Cancel fontSize="inherit" />} severity="error" sx={{ mb: 2 }}>
                    {verificationResult.message || verificationResult.error_message || "Unknown error during verification."}
                  </Alert>
                )}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F9FAFB" }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={1} color="#4B5563">
                    Pass Details:
                  </Typography>
                   <Row>
                      <Col xs={6}>
                         <Typography variant="body2" color="#6B7280">Student ID:</Typography>
                         <Typography fontWeight={500}>{verificationResult.pass_details?.student_id || "N/A"}</Typography>
                      </Col>
                      <Col xs={6}>
                         <Typography variant="body2" color="#6B7280">Student Name:</Typography>
                         <Typography fontWeight={500}>{verificationResult.pass_details?.student_name || "N/A"}</Typography>
                      </Col>
                      <Col xs={6}>
                         <Typography variant="body2" color="#6B7280">Pass Type:</Typography>
                         <Typography fontWeight={500}>{verificationResult.pass_details?.pass_type || "N/A"}</Typography>
                      </Col>
                      <Col xs={6}>
                         <Typography variant="body2" color="#6B7280">Valid Until:</Typography>
                         <Typography fontWeight={500}>
                            {verificationResult.pass_details?.date_valid_to
                               ? new Date(verificationResult.pass_details.date_valid_to).toLocaleDateString()
                               : "N/A"}
                         </Typography>
                      </Col>
                   </Row>
                </Paper>
              </Box>
            )}
          </Paper>
        </Col>
        <Col xs={12} lg={5}>
          <LiveLogTable logs={uniqueLogs} loading={logLoading} />
        </Col>
      </Row>
    </Box>
  );
}