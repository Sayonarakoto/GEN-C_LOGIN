/**
 * @file validationRules.js
 * @description Core validation utilities and rule validators for form validation.
 */

/**
 * Checks if a value is considered empty.
 * @param {*} value - Value to check.
 * @returns {boolean} True if empty, false otherwise.
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validates that a field is not empty.
 * @param {*} value - The input value.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validateRequired(value, customMessage) {
  if (isEmpty(value)) {
    return customMessage || 'This field is required';
  }
  return null;
}

/**
 * Validates an email address format.
 * @param {*} value - The email string.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validateEmail(value, customMessage) {
  if (isEmpty(value)) return null; // Let validateRequired handle empty values
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(String(value).trim())) {
    return customMessage || 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validates minimum character length.
 * @param {*} value - The input string or array.
 * @param {number} min - Minimum required length.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validateMinLength(value, min, customMessage) {
  if (isEmpty(value)) return null;
  const len = typeof value === 'string' ? value.trim().length : (value?.length || 0);
  if (len < min) {
    return customMessage || `Must be at least ${min} characters`;
  }
  return null;
}

/**
 * Validates maximum character length.
 * @param {*} value - The input string or array.
 * @param {number} max - Maximum allowed length.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validateMaxLength(value, max, customMessage) {
  if (isEmpty(value)) return null;
  const len = typeof value === 'string' ? value.trim().length : (value?.length || 0);
  if (len > max) {
    return customMessage || `Must not exceed ${max} characters`;
  }
  return null;
}

/**
 * Validates that a value matches a regular expression pattern.
 * @param {*} value - The input value.
 * @param {RegExp} pattern - Regular expression to test against.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validatePattern(value, pattern, customMessage) {
  if (isEmpty(value)) return null;
  if (!pattern || !pattern.test(String(value))) {
    return customMessage || 'Invalid format';
  }
  return null;
}

/**
 * Validates a numeric value within optional range boundaries.
 * @param {*} value - The input number or string.
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.min] - Minimum value.
 * @param {number} [options.max] - Maximum value.
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {string|null} Error message or null if valid.
 */
export function validateNumeric(value, options = {}, customMessage) {
  if (isEmpty(value)) return null;
  const num = Number(value);
  if (Number.isNaN(num)) {
    return customMessage || 'Must be a valid number';
  }
  if (options.min !== undefined && num < options.min) {
    return customMessage || `Must be greater than or equal to ${options.min}`;
  }
  if (options.max !== undefined && num > options.max) {
    return customMessage || `Must be less than or equal to ${options.max}`;
  }
  return null;
}

/**
 * Evaluates all validation rules defined for a single field.
 * @param {*} value - Value of the field.
 * @param {Object} rules - Rules object for the field.
 * @param {Object} [allValues] - All form values (for cross-field validation).
 * @returns {string|null} The first failing error message or null.
 */
export function validateField(value, rules = {}, allValues = {}) {
  try {
    if (!rules || typeof rules !== 'object') return null;

    // Required check
    if (rules.required) {
      const msg = typeof rules.required === 'string' ? rules.required : undefined;
      const error = validateRequired(value, msg);
      if (error) return error;
    }

    // Skip further checks if empty and not required
    if (isEmpty(value)) {
      return null;
    }

    // Email check
    if (rules.email) {
      const msg = typeof rules.email === 'string' ? rules.email : undefined;
      const error = validateEmail(value, msg);
      if (error) return error;
    }

    // Min Length
    if (rules.minLength !== undefined) {
      const min = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
      const msg = typeof rules.minLength === 'object' ? rules.minLength.message : undefined;
      const error = validateMinLength(value, min, msg);
      if (error) return error;
    }

    // Max Length
    if (rules.maxLength !== undefined) {
      const max = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
      const msg = typeof rules.maxLength === 'object' ? rules.maxLength.message : undefined;
      const error = validateMaxLength(value, max, msg);
      if (error) return error;
    }

    // Pattern (Regex)
    if (rules.pattern) {
      const regex = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.regex;
      const msg = rules.pattern.message || undefined;
      const error = validatePattern(value, regex, msg);
      if (error) return error;
    }

    // Numeric check
    if (rules.numeric) {
      const options = typeof rules.numeric === 'object' ? rules.numeric : {};
      const msg = options.message || undefined;
      const error = validateNumeric(value, options, msg);
      if (error) return error;
    }

    // Custom Validator Function: (val, allVals) => string | null
    if (typeof rules.custom === 'function') {
      const customResult = rules.custom(value, allValues);
      if (customResult) return customResult;
    }

    // Array of custom validator functions
    if (Array.isArray(rules.validators)) {
      for (const validator of rules.validators) {
        if (typeof validator === 'function') {
          const res = validator(value, allValues);
          if (res) return res;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Validation rule error:', err);
    return 'Validation failed';
  }
}

/**
 * Evaluates validation rules for an entire form state.
 * @param {Object} values - Current form values object.
 * @param {Object} schema - Validation schema mapping field names to rule objects.
 * @returns {Object} Object mapping field names to error message strings.
 */
export function validateForm(values = {}, schema = {}) {
  const errors = {};
  if (!schema || typeof schema !== 'object') return errors;

  for (const field of Object.keys(schema)) {
    const error = validateField(values[field], schema[field], values);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}
