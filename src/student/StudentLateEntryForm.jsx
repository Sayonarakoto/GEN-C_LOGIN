/**
 * @file StudentLateEntryForm.jsx
 * @description Standardized Student Late Entry Form component.
 * Refactored to leverage centralized Atomic common components and hook-based validation.
 */

import React, { useState, useEffect } from 'react';
import { FormField, Dropdown, useFormValidation } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import useToastService from '../hooks/useToastService';

/**
 * StudentLateEntryForm Component.
 *
 * @param {Object} props - Component properties.
 * @param {Object} [props.entryData] - Existing entry data when editing.
 * @param {Function} props.onSubmit - Callback invoked with valid form payload.
 * @param {boolean} [props.loading=false] - External loading indicator.
 * @returns {JSX.Element} StudentLateEntryForm component.
 */
export default function StudentLateEntryForm({ entryData, onSubmit, loading: formLoading = false }) {
  const { user } = useAuth();
  const toast = useToastService();

  const [facultyList, setFacultyList] = useState([]);
  const [hodId, setHodId] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Validation rules schema
  const validationSchema = {
    date: {
      required: 'Date of late entry is required',
    },
    facultyId: {
      required: 'Please select a faculty member',
    },
    reason: {
      required: 'Please provide a detailed reason',
      minLength: {
        value: 10,
        message: 'Reason must be at least 10 characters long',
      },
      maxLength: {
        value: 500,
        message: 'Reason cannot exceed 500 characters',
      },
    },
  };

  // Form submission handler called when validation passes
  const handleValidSubmit = async (values) => {
    try {
      const payload = {
        reason: values.reason.trim(),
        facultyId: values.facultyId,
        date: values.date,
        HODId: values.escalate && hodId ? hodId : null,
      };

      await onSubmit(payload);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit late entry request.');
    }
  };

  const {
    values,
    isSubmitting,
    handleChange,
    setFieldValue,
    setFieldTouched,
    handleSubmit,
    getFieldProps,
    getErrorMessage,
  } = useFormValidation({
    initialValues: {
      date: entryData?.date
        ? new Date(entryData.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      facultyId: entryData?.facultyId?._id || entryData?.facultyId || '',
      reason: entryData?.reason || '',
      escalate: entryData?.requiresHODApproval || false,
    },
    validationSchema,
    onSubmit: handleValidSubmit,
  });

  // Fetch faculty and HOD data
  useEffect(() => {
    const fetchRequiredData = async () => {
      if (!user || !user.department) {
        setLoadingData(false);
        return;
      }

      try {
        // Fetch Faculty List
        const facultyResponse = await api.get(`/api/faculty/by-department/${user.department}`);
        if (facultyResponse.data?.data) {
          setFacultyList(
            facultyResponse.data.data.map((f) => ({
              value: f._id,
              label: f.fullName,
            }))
          );
        }

        // Fetch HOD ID
        const hodResponse = await api.get(`/api/faculty/hod/by-department/${user.department}`);
        if (hodResponse.data?.data?._id) {
          setHodId(hodResponse.data.data._id);
        }
      } catch (error) {
        console.error('Failed to fetch required data:', error);
        toast.error('Failed to load department faculty. Please refresh the page.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchRequiredData();
  }, [user, toast]);

  const isBusy = isSubmitting || formLoading;

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #dee2e6)',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 8px var(--card-shadow, rgba(0, 0, 0, 0.05))',
      }}
    >
      <h4
        style={{
          fontWeight: 700,
          color: 'var(--text-primary, #212529)',
          marginBottom: '1.5rem',
        }}
      >
        Student Late Entry Form
      </h4>

      <form onSubmit={handleSubmit()} noValidate>
        {/* Date Input using FormField */}
        <FormField
          label="Date of Late Entry"
          type="date"
          required
          disabled={isBusy}
          {...getFieldProps('date')}
        />

        {/* Faculty Select using Dropdown */}
        <Dropdown
          label="Faculty Member"
          required
          options={facultyList}
          value={values.facultyId}
          placeholder={loadingData ? 'Loading faculty...' : 'Select a faculty member'}
          searchable={true}
          searchPlaceholder="Search faculty by name..."
          loading={loadingData}
          disabled={isBusy || loadingData}
          error={getErrorMessage('facultyId')}
          onChange={(e) => setFieldValue('facultyId', e.target.value)}
          onBlur={() => setFieldTouched('facultyId', true)}
        />

        {/* Reason Textarea using FormField */}
        <FormField
          as="textarea"
          rows={4}
          label="Reason for Late Entry"
          placeholder="Enter detailed reason for your late entry"
          required
          disabled={isBusy}
          helperText="Provide a clear justification (at least 10 characters)."
          {...getFieldProps('reason')}
        />

        {/* Escalate To HOD Checkbox */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: loadingData || !hodId ? 'not-allowed' : 'pointer',
              color: 'var(--text-primary, #212529)',
              fontWeight: 500,
              fontSize: '0.9375rem',
            }}
          >
            <input
              type="checkbox"
              name="escalate"
              checked={Boolean(values.escalate)}
              onChange={handleChange}
              disabled={isBusy || loadingData || !hodId}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Escalate to HOD for Priority Review (Mandatory Hold)</span>
          </label>
          <p
            style={{
              margin: '0.25rem 0 0 1.5rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary, #6c757d)',
            }}
          >
            Select this only for urgent cases. Your request will be held until the HOD reviews it.
          </p>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isBusy || loadingData}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: 'var(--primary-color, #0d6efd)',
            border: 'none',
            borderRadius: '6px',
            cursor: isBusy || loadingData ? 'not-allowed' : 'pointer',
            opacity: isBusy || loadingData ? 0.7 : 1,
            transition: 'background-color 0.2s ease, opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {isBusy && (
            <span
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: '#ffffff',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}
          <span>{isBusy ? 'Submitting...' : 'Submit Request'}</span>
        </button>
      </form>
    </div>
  );
}
