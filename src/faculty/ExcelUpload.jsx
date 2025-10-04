import React, { useState } from 'react';
import api from '../api/client';
import useToastService from '../hooks/useToastService';
import {
  Box,
  Button,
  Typography,
  Paper,
  Input,
  Stack,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ExcelUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToastService();

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
          onUploadSuccess(response.data.uploaded);
        }
      } else if (response.data.success && response.data.errors && response.data.errors.length > 0) {
        toast.warning(`File processed with some errors: ${response.data.message}`);
        if (onUploadSuccess) {
          onUploadSuccess(response.data.uploaded);
        }
        console.warn('Upload errors:', response.data.errors);
      } else {
        toast.error(response.data.message || 'Upload failed.');
        console.error('Upload failed:', response.data.errors);
      }
      setSelectedFile(null);
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
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, margin: 'auto', mt: 5, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Upload Student Data
      </Typography>
      <Stack spacing={3} alignItems="center">
        <Input
          type="file"
          inputProps={{ accept: ".xlsx,.xls" }}
          onChange={handleFileChange}
          sx={{ display: 'none' }}
          id="excel-upload-button"
        />
        <label htmlFor="excel-upload-button">
          <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
            {selectedFile ? selectedFile.name : 'Select Excel File'}
          </Button>
        </label>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload Excel'}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ExcelUpload;
