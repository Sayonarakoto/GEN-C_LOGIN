import React, { useEffect, useRef } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ onScanSuccess, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const streamRef = useRef(null);

  // Use a ref to hold the latest callbacks, preventing the effect from re-running
  const onScanSuccessRef = useRef(onScanSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const scanLoop = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        // If a code is found, stop the camera and call the success callback
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        onScanSuccessRef.current(code.data);
        return; // Stop the loop
      }
    }
    // Continue the loop if no code is found
    animationFrameId.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
                console.error("Play error:", err);
                onErrorRef.current(err);
            });
            animationFrameId.current = requestAnimationFrame(scanLoop);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        onErrorRef.current(err);
      }
    };

    startCamera();

    // Cleanup function to stop the camera and animation frame
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: 'block', width: '100%' }}
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default QRScanner;