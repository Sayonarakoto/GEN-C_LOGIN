import React, { useState } from 'react';
import api from '../api/client';
import LoginCard from './common/LoginCard'; // Assuming LoginCard is in common subfolder

const ExcelUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first!');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Check for success flag and errors array from backend
      if (response.data.success && (!response.data.errors || response.data.errors.length === 0)) {
        setMessage('File processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data.uploaded); // Pass only uploaded students
        }
      } else if (response.data.success && response.data.errors && response.data.errors.length > 0) {
        // Partial success with errors
        setMessage(`File processed with some errors: ${response.data.message}`);
        if (onUploadSuccess) {
          onUploadSuccess(response.data.uploaded); // Still pass uploaded students
        }
        console.warn('Upload errors:', response.data.errors);
      } else {
        // Should not happen if backend sends 400 for errors, but as a fallback
        setMessage(response.data.message || 'Upload failed.');
        console.error('Upload failed:', response.data.errors);
      }
      setSelectedFile(null); // Clear selected file
    } catch (error) {
      // This will now catch both Network Errors and the 400 Bad Request from backend
      const errorMessage = error.response?.data?.message || 'Upload failed due to a network error.';
      setMessage(errorMessage);
      console.error("Error uploading file:", error);
      // Optionally, if there are specific errors from backend, display them
      if (error.response?.data?.errors) {
        console.error("Backend errors:", error.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <LoginCard title="Upload Student Data">
      <div className="d-flex flex-column align-items-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="form-control mb-3"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="btn btn-primary w-100"
        >
          {uploading ? 'Uploading...' : 'Upload Excel'}
        </button>
        {message && <p className="mt-3">{message}</p>}
      </div>
    </LoginCard>
  );
};

export default ExcelUpload;