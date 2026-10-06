import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import api from '../api/client';
import useToastService from '../hooks/useToastService';

const FacultySettings = () => {
  const toast = useToastService();

  const [form, setForm] = useState({
    collegeHoursStart: '09:30',
    collegeHoursEnd: '16:00',
    lateEntryCutoff: '09:30',
  });
  const [meta, setMeta] = useState({ source: 'env', updatedBy: null, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const applySettings = useCallback((data) => {
    setForm({
      collegeHoursStart: data.collegeHoursStart || '09:30',
      collegeHoursEnd: data.collegeHoursEnd || '16:00',
      lateEntryCutoff: data.lateEntryCutoff || '09:30',
    });
    setMeta({
      source: data.source || 'env',
      updatedBy: data.updatedBy || null,
      updatedAt: data.updatedAt || null,
    });
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/settings');
      if (response.data.success) {
        applySettings(response.data.data);
      } else {
        setError('Failed to load settings.');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validate = () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const fields = [
      ['collegeHoursStart', 'College hours start'],
      ['collegeHoursEnd', 'College hours end'],
      ['lateEntryCutoff', 'Late entry cutoff'],
    ];
    for (const [key, label] of fields) {
      if (!timeRegex.test(form[key])) {
        toast.error(`${label} must be a valid time (HH:MM).`);
        return false;
      }
    }
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    if (toMinutes(form.collegeHoursStart) >= toMinutes(form.collegeHoursEnd)) {
      toast.error('College hours start time must be before the end time.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const response = await api.put('/settings', form);
      if (response.data.success) {
        applySettings(response.data.data);
        toast.success(response.data.message || 'Settings saved.');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const response = await api.post('/settings/reset');
      if (response.data.success) {
        applySettings(response.data.data);
        toast.success(response.data.message || 'Settings reset to defaults.');
      }
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toast.error(err.response?.data?.message || 'Failed to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Application Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Time windows used when students request gate passes and special passes. Changes apply
        immediately - no server restart required.
      </Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  College Hours
                </Typography>
                <Chip
                  size="small"
                  label={meta.source === 'db' ? 'Custom' : 'Env default'}
                  color={meta.source === 'db' ? 'primary' : 'default'}
                  variant={meta.source === 'db' ? 'filled' : 'outlined'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Allowed window for gate pass exit/return times and special pass start/end times.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start"
                  type="time"
                  value={form.collegeHoursStart}
                  onChange={handleChange('collegeHoursStart')}
                  inputProps={{ step: 300 }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End"
                  type="time"
                  value={form.collegeHoursEnd}
                  onChange={handleChange('collegeHoursEnd')}
                  inputProps={{ step: 300 }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Late Entry Cutoff
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Saved for future use - late entry submissions are not time-restricted yet.
              </Alert>
              <TextField
                label="Cutoff"
                type="time"
                value={form.lateEntryCutoff}
                onChange={handleChange('lateEntryCutoff')}
                inputProps={{ step: 300 }}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {meta.updatedAt && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(meta.updatedAt).toLocaleString()}
              </Typography>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                disabled={saving}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default FacultySettings;
