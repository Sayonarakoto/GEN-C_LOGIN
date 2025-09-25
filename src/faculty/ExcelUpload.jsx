import React, { useState } from 'react';
import api from '../api/client';
import LoginCard from '../components/common/LoginCard';
import useToastService from '../hooks/useToastService'; // Import ToastService

const ExcelUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToastService(); // Initialize toast service

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first!');
      return;
    }

    setUploading(true);
    toast.info('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/upload', formData, {
      });

      if (response.data.success && (!response.data.errors || response.data.errors.length === 0)) {
        toast.success('File processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data.uploaded); // Pass only uploaded students
        }
      } else if (response.data.success && response.data.errors && response.data.errors.length > 0) {
        toast.warning(`File processed with some errors: ${response.data.message}`);
        if (onUploadSuccess) {
          onUploadSuccess(response.data.uploaded); // Still pass uploaded students
        }
        console.warn('Upload errors:', response.data.errors);
      } else {
        toast.error(response.data.message || 'Upload failed.');
        console.error('Upload failed:', response.data.errors);
      }
      setSelectedFile(null); // Clear selected file
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Upload failed due to a network error.';
      toast.error(errorMessage);
      console.error("Error uploading file:", error);
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
      </div>
    </LoginCard>
  );
};

export default ExcelUpload;
