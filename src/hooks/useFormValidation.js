/**
 * @file useFormValidation.js
 * @description Custom React hook for robust, standardized form state and validation management.
 * Adheres to Atomic Design and replaces ad-hoc browser alert() and fragmented validation logic.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { validateField as runFieldValidation, validateForm as runFormValidation } from '../utils/validationRules.js';

/**
 * Custom hook to manage form state, validation, touched status, and submission.
 *
 * @param {Object} options - Configuration options for the hook.
 * @param {Object} [options.initialValues={}] - Initial key-value pairs for form fields.
 * @param {Object} [options.validationSchema={}] - Validation rules mapped by field name.
 * @param {Function} [options.onSubmit] - Callback triggered upon valid form submission.
 * @param {boolean} [options.validateOnChange=true] - Whether to validate when a field value changes (if touched).
 * @param {boolean} [options.validateOnBlur=true] - Whether to validate when a field loses focus.
 * @returns {Object} Form controller containing state, handlers, and helper utilities.
 */
export function useFormValidation({
  initialValues = {},
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
} = {}) {
  const initialValuesRef = useRef(initialValues);
  const [values, setValuesState] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  /**
   * Validates a single field against the schema.
   * @param {string} fieldName - Name of the field to validate.
   * @param {*} value - The value to test.
   * @returns {string|null} Error string or null if valid.
   */
  const validateField = useCallback(
    (fieldName, value) => {
      try {
        const rules = validationSchema[fieldName];
        if (!rules) return null;
        return runFieldValidation(value, rules, values);
      } catch (err) {
        console.error(`Error validating field "${fieldName}":`, err);
        return 'Validation failed';
      }
    },
    [validationSchema, values]
  );

  /**
   * Validates all fields against the schema.
   * @param {Object} [valuesToValidate] - Optional custom values to evaluate.
   * @returns {Object} Object mapping field names to error messages.
   */
  const validateAll = useCallback(
    (valuesToValidate = values) => {
      try {
        const validationErrors = runFormValidation(valuesToValidate, validationSchema);
        setErrors(validationErrors);
        return validationErrors;
      } catch (err) {
        console.error('Error validating form schema:', err);
        return {};
      }
    },
    [validationSchema, values]
  );

  /**
   * Sets value for a specific field.
   * @param {string} fieldName - Target field name.
   * @param {*} value - New value for the field.
   * @param {boolean} [shouldValidate] - Whether to trigger validation.
   */
  const setFieldValue = useCallback(
    (fieldName, value, shouldValidate = true) => {
      setValuesState((prev) => {
        const nextValues = { ...prev, [fieldName]: value };

        if (shouldValidate && (validateOnChange || touched[fieldName])) {
          const fieldError = runFieldValidation(value, validationSchema[fieldName], nextValues);
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            if (fieldError) {
              nextErrors[fieldName] = fieldError;
            } else {
              delete nextErrors[fieldName];
            }
            return nextErrors;
          });
        }

        return nextValues;
      });
    },
    [touched, validateOnChange, validationSchema]
  );

  /**
   * Sets touched state for a specific field.
   * @param {string} fieldName - Target field name.
   * @param {boolean} [isTouched=true] - Touched state.
   * @param {boolean} [shouldValidate=true] - Whether to run validation.
   */
  const setFieldTouched = useCallback(
    (fieldName, isTouched = true, shouldValidate = true) => {
      setTouched((prev) => ({ ...prev, [fieldName]: isTouched }));

      if (shouldValidate && isTouched) {
        const fieldError = validateField(fieldName, values[fieldName]);
        setErrors((prev) => {
          const next = { ...prev };
          if (fieldError) {
            next[fieldName] = fieldError;
          } else {
            delete next[fieldName];
          }
          return next;
        });
      }
    },
    [validateField, values]
  );

  /**
   * Sets a manual error message for a field.
   * @param {string} fieldName - Target field.
   * @param {string|null} errorMessage - Error message or null to clear.
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (errorMessage) {
        next[fieldName] = errorMessage;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  }, []);

  /**
   * Handles generic input change event.
   * Supports DOM event (e.target.name) or direct key/value invocation.
   */
  const handleChange = useCallback(
    (eventOrName, directValue) => {
      try {
        if (typeof eventOrName === 'string') {
          setFieldValue(eventOrName, directValue);
        } else if (eventOrName && eventOrName.target) {
          const { name, value, type, checked } = eventOrName.target;
          const fieldValue = type === 'checkbox' ? checked : value;
          setFieldValue(name, fieldValue);
        }
      } catch (err) {
        console.error('Error in form handleChange:', err);
      }
    },
    [setFieldValue]
  );

  /**
   * Handles input blur event to mark field as touched and validate.
   */
  const handleBlur = useCallback(
    (eventOrName) => {
      try {
        const fieldName = typeof eventOrName === 'string' ? eventOrName : eventOrName?.target?.name;
        if (fieldName) {
          setFieldTouched(fieldName, true, validateOnBlur);
        }
      } catch (err) {
        console.error('Error in form handleBlur:', err);
      }
    },
    [setFieldTouched, validateOnBlur]
  );

  /**
   * Resets form values and states back to initial or newly supplied values.
   * @param {Object} [nextInitialValues] - Optional new initial values.
   */
  const resetForm = useCallback((nextInitialValues) => {
    const freshValues = nextInitialValues || initialValuesRef.current || {};
    setValuesState(freshValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, []);

  /**
   * Sets entire form values object.
   * @param {Object} newValues - New values object.
   * @param {boolean} [shouldValidate=false] - Whether to re-validate entire form.
   */
  const setValues = useCallback(
    (newValues, shouldValidate = false) => {
      setValuesState(newValues);
      if (shouldValidate) {
        validateAll(newValues);
      }
    },
    [validateAll]
  );

  /**
   * Checks if a specific field has an active error to display.
   * @param {string} fieldName - Field to check.
   * @returns {boolean} True if field is touched and has an error.
   */
  const hasError = useCallback(
    (fieldName) => {
      return Boolean((touched[fieldName] || submitCount > 0) && errors[fieldName]);
    },
    [errors, submitCount, touched]
  );

  /**
   * Gets the active error message for a field if touched or submitted.
   * @param {string} fieldName - Field to check.
   * @returns {string} Error message string or empty string.
   */
  const getErrorMessage = useCallback(
    (fieldName) => {
      return (touched[fieldName] || submitCount > 0) && errors[fieldName] ? errors[fieldName] : '';
    },
    [errors, submitCount, touched]
  );

  /**
   * Returns convenient props to bind to an input or FormField component.
   * @param {string} fieldName - Field identifier.
   * @returns {Object} Props object.
   */
  const getFieldProps = useCallback(
    (fieldName) => ({
      name: fieldName,
      value: values[fieldName] !== undefined ? values[fieldName] : '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: getErrorMessage(fieldName),
      isInvalid: hasError(fieldName),
    }),
    [getErrorMessage, handleBlur, handleChange, hasError, values]
  );

  /**
   * Wraps form submission with schema validation, touched state marking, and async handling.
   * @param {Function} [customOnSubmit] - Optional override callback.
   * @returns {Function} Event listener handler for <form onSubmit>.
   */
  const handleSubmit = useCallback(
    (customOnSubmit) => async (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }

      setSubmitCount((count) => count + 1);

      // Mark all fields in schema and values as touched
      const allFieldNames = Array.from(
        new Set([...Object.keys(values), ...Object.keys(validationSchema)])
      );
      const allTouched = allFieldNames.reduce((acc, name) => {
        acc[name] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate all fields
      const currentErrors = runFormValidation(values, validationSchema);
      setErrors(currentErrors);

      const isValidForm = Object.keys(currentErrors).length === 0;

      if (!isValidForm) {
        return;
      }

      const callback = customOnSubmit || onSubmit;
      if (!callback) return;

      setIsSubmitting(true);
      try {
        await callback(values);
      } catch (err) {
        console.error('Form submission handler failed:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validationSchema, values]
  );

  // Derived calculations
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    submitCount,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setValues,
    setErrors,
    resetForm,
    validateField,
    validateAll,
    handleSubmit,
    getFieldProps,
    hasError,
    getErrorMessage,
  };
}

export default useFormValidation;
