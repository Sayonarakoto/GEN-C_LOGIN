import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'; // Import Html5QrcodeSupportedFormats
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
                    facingMode: "environment",
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] // ADD THIS LINE
                },
                false
            );

            const handleSuccess = (decodedText) => {
                console.log("QR Code Scanned - Raw decodedText:", decodedText); // Modified log
                setErrorMessage(''); // Clear previous errors

                if (decodedText && decodedText.trim() !== '') { // Only clear and call onScanSuccess if decodedText is valid
                    scannerRef.current.clear().then(() => {
                        onScanSuccess(decodedText);
                    }).catch(err => {
                        console.error("Failed to stop scanner after successful read:", err);
                        setErrorMessage("Failed to stop the scanner after a successful scan.");
                    });
                } else {
                    // If decodedText is empty or just whitespace, keep scanner open and show error
                    setErrorMessage("QR code detected, but no valid text found. Please ensure the QR code is clear and try again.");
                    // Do NOT call scannerRef.current.clear() here
                }
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