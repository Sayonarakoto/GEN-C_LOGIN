import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Box, Typography } from '@mui/material';
import AlertMessage from './AlertMessage';

const QRScanner = ({ onScanSuccess, scanResult, isError, qrBoxSize = 250, scanInterval = 100 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusText, setStatusText] = useState('Initializing camera...');
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef(null);  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)) {
      setIsMobile(true);
    }
  }, []);


  const drawQrBox = (ctx, location) => {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF3B58';
    ctx.beginPath();
    ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    ctx.lineTo(location.topLeftCorner.x, location.topLeftCorner.y);
    ctx.stroke();
  };

  const scanLoop = () => {
    if (!scanning) return; // Only run if scanning is true
    animationRef.current = requestAnimationFrame(scanLoop);

    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        drawQrBox(ctx, code.location); // Draw box around detected QR
        setStatusText('QR detected! Verifying...');
        setScanning(false); // Stop scanning after detection
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        try {
          onScanSuccess(code.data);
        } catch (error) {
          setErrorMessage('Failed to process scanned QR code.');
          console.error(error);
        }
      } else {
        setStatusText('Scanning for QR code...');
      }
    }
  };

  const startCamera = async () => {
    try {
      setErrorMessage('');
      setStatusText('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatusText('Camera ready. Point at QR code...');
        setScanning(true); // Start scanning loop
        scanLoop();
      }
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`;
      setErrorMessage(errorMessage);
      setStatusText('Camera unavailable');
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [onScanSuccess]);

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Scan Approved Special Pass
      </Typography>

      {/* Display API feedback from parent */}
      {scanResult && (
        <AlertMessage message={scanResult} type={isError ? 'error' : 'success'} duration={5000} />
      )}

      {/* Display scanner-local errors */}
      {errorMessage && <AlertMessage message={errorMessage} type="error" duration={5000} />}

      <video
        ref={videoRef}
        style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
        muted
        playsInline
      />

      {/* Hidden canvas for processing frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Typography variant="body2" color="textSecondary">
        Position the QR code within the view. Works on mobile and desktop.
      </Typography>
    </Box>
  );
};

export default QRScanner;
