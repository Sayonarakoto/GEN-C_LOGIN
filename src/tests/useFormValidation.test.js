/**
 * @file useFormValidation.test.js
 * @description Unit tests for form validation workflow and helper utilities.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateField,
  validateForm,
} from '../utils/validationRules.js';

describe('Form Validation Workflow', () => {
  const lateEntrySchema = {
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

  it('detects missing required fields on empty submission', () => {
    const emptyValues = {
      date: '',
      facultyId: '',
      reason: '',
      escalate: false,
    };

    const errors = validateForm(emptyValues, lateEntrySchema);
    assert.equal(errors.date, 'Date of late entry is required');
    assert.equal(errors.facultyId, 'Please select a faculty member');
    assert.equal(errors.reason, 'Please provide a detailed reason');
  });

  it('rejects reason shorter than 10 characters', () => {
    const invalidValues = {
      date: '2026-11-26',
      facultyId: 'fac-123',
      reason: 'Late bus', // 8 chars
      escalate: false,
    };

    const errors = validateForm(invalidValues, lateEntrySchema);
    assert.equal(errors.date, undefined);
    assert.equal(errors.facultyId, undefined);
    assert.equal(errors.reason, 'Reason must be at least 10 characters long');
  });

  it('passes validation when all fields meet constraints', () => {
    const validValues = {
      date: '2026-11-26',
      facultyId: 'fac-123',
      reason: 'Heavy traffic congestion due to rain on highway',
      escalate: false,
    };

    const errors = validateForm(validValues, lateEntrySchema);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('supports custom validator functions in field rules', () => {
    const customSchema = {
      code: {
        required: 'Code required',
        custom: (val) => (val.startsWith('GEN-') ? null : 'Code must begin with GEN-'),
      },
    };

    const fail = validateForm({ code: 'ABC-123' }, customSchema);
    assert.equal(fail.code, 'Code must begin with GEN-');

    const pass = validateForm({ code: 'GEN-2026' }, customSchema);
    assert.equal(pass.code, undefined);
  });
});
