import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography } from '@mui/material';
import AlertMessage from './AlertMessage'; // Import the AlertMessage component

const qrcodeRegionId = "html5qr-code-full-region";

/**
 * Component to wrap the html5-qrcode library for scanning passes.
 * @param {function} onScanSuccess - Callback function when a QR code is successfully scanned.
 * @param {string} scanResult - The result message from the parent (e.g., "Pass Verified").
 * @param {boolean} isError - Flag from the parent indicating if the last scan was an error.
 */
const SecurityScanner = ({ onScanSuccess, scanResult, isError }) => {
    const scannerRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                qrcodeRegionId,
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    facingMode: "environment" 
                },
                false
            );

            const handleSuccess = (decodedText) => {
                setErrorMessage(''); // Clear previous errors
                scannerRef.current.clear().then(() => {
                    if (decodedText) { // Ensure decodedText is not empty
                        onScanSuccess(decodedText);
                    } else {
                        setErrorMessage("QR code decoded, but no text found.");
                    }
                }).catch(err => {
                    console.error("Failed to stop scanner:", err);
                    setErrorMessage("Failed to stop the scanner after a successful scan.");
                });
            };

            scannerRef.current.render(handleSuccess);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => {
                    console.error("Failed to clear html5QrcodeScanner on cleanup", err);
                });
                scannerRef.current = null;
            }
        };
    }, [onScanSuccess]);

    return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Scan Approved Special Pass</Typography>
            
            {/* Display API feedback from the parent component */}
            {scanResult && (
                <AlertMessage
                    message={scanResult}
                    type={isError ? 'error' : 'success'}
                    duration={5000} // Keep the message visible longer
                />
            )}

            {/* Display scanner-specific errors */}
            {errorMessage && (
                <AlertMessage
                    message={errorMessage}
                    type="error"
                    duration={5000}
                />
            )}

            <div id={qrcodeRegionId} style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}></div>
        </Box>
    );
};

export default SecurityScanner;