import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEmpty,
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateNumeric,
  validateField,
  validateForm,
} from './validationRules.js';

describe('validationRules', () => {
  describe('isEmpty', () => {
    it('identifies empty values correctly', () => {
      assert.equal(isEmpty(null), true);
      assert.equal(isEmpty(undefined), true);
      assert.equal(isEmpty(''), true);
      assert.equal(isEmpty('   '), true);
      assert.equal(isEmpty([]), true);
      assert.equal(isEmpty({}), true);
      assert.equal(isEmpty('hello'), false);
      assert.equal(isEmpty([1]), false);
      assert.equal(isEmpty({ key: 'val' }), false);
      assert.equal(isEmpty(0), false);
      assert.equal(isEmpty(false), false);
    });
  });

  describe('validateRequired', () => {
    it('returns error when value is empty', () => {
      assert.equal(validateRequired(''), 'This field is required');
      assert.equal(validateRequired(null, 'Custom required'), 'Custom required');
    });

    it('returns null when value is provided', () => {
      assert.equal(validateRequired('valid'), null);
      assert.equal(validateRequired(0), null);
      assert.equal(validateRequired(false), null);
    });
  });

  describe('validateEmail', () => {
    it('returns error on invalid email', () => {
      assert.equal(validateEmail('invalid-email'), 'Please enter a valid email address');
      assert.equal(validateEmail('user@domain', 'Must be valid'), 'Must be valid');
      assert.equal(validateEmail('@domain.com'), 'Please enter a valid email address');
    });

    it('returns null on valid email', () => {
      assert.equal(validateEmail('user@test.edu'), null);
      assert.equal(validateEmail('john.doe+filter@example.co.uk'), null);
    });

    it('returns null for empty value (delegates to required)', () => {
      assert.equal(validateEmail(''), null);
    });
  });

  describe('validateMinLength & validateMaxLength', () => {
    it('validates minimum length', () => {
      assert.equal(validateMinLength('ab', 3), 'Must be at least 3 characters');
      assert.equal(validateMinLength('abc', 3), null);
      assert.equal(validateMinLength([1, 2], 3), 'Must be at least 3 characters');
      assert.equal(validateMinLength([1, 2, 3], 3), null);
    });

    it('validates maximum length', () => {
      assert.equal(validateMaxLength('abcd', 3), 'Must not exceed 3 characters');
      assert.equal(validateMaxLength('abc', 3), null);
      assert.equal(validateMaxLength([1, 2, 3, 4], 3), 'Must not exceed 3 characters');
    });
  });

  describe('validatePattern & validateNumeric', () => {
    it('validates pattern regex', () => {
      const reg = /^[0-9]{4}$/;
      assert.equal(validatePattern('12a4', reg), 'Invalid format');
      assert.equal(validatePattern('1234', reg), null);
    });

    it('validates numeric values and bounds', () => {
      assert.equal(validateNumeric('abc'), 'Must be a valid number');
      assert.equal(validateNumeric('4', { min: 5 }), 'Must be greater than or equal to 5');
      assert.equal(validateNumeric('15', { max: 10 }), 'Must be less than or equal to 10');
      assert.equal(validateNumeric('7', { min: 5, max: 10 }), null);
    });
  });

  describe('validateField & validateForm', () => {
    it('evaluates rule pipeline correctly', () => {
      const rules = {
        required: 'Field is required',
        minLength: { value: 5, message: 'Too short' },
        custom: (val) => (val === 'admin' ? 'Cannot be admin' : null),
      };

      assert.equal(validateField('', rules), 'Field is required');
      assert.equal(validateField('abc', rules), 'Too short');
      assert.equal(validateField('admin', rules), 'Cannot be admin');
      assert.equal(validateField('validValue', rules), null);
    });

    it('evaluates entire form schema', () => {
      const schema = {
        name: { required: 'Name required', minLength: 2 },
        email: { required: 'Email required', email: true },
        notes: { maxLength: 10 },
      };

      const values = {
        name: 'A',
        email: 'invalid',
        notes: 'short',
      };

      const errors = validateForm(values, schema);
      assert.equal(errors.name, 'Must be at least 2 characters');
      assert.equal(errors.email, 'Please enter a valid email address');
      assert.equal(errors.notes, undefined);
    });
  });
});
