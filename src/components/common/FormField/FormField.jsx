/**
 * @file FormField.jsx
 * @description Standard reusable FormField component (Atom/Molecule in Atomic Design).
 * Integrates labeling, validation feedback, icons, helper text, and accessible attributes.
 */

import React, { forwardRef, useId } from 'react';
import styles from './FormField.module.css';

/**
 * Standard form field input component.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.id] - Optional custom element ID (auto-generated if omitted).
 * @param {string} [props.name] - Field name identifier.
 * @param {string} [props.label] - Label text displayed above the input.
 * @param {string} [props.type='text'] - Input type ('text', 'email', 'date', 'number', 'password', etc.).
 * @param {*} [props.value] - Controlled field value.
 * @param {Function} [props.onChange] - Change handler function.
 * @param {Function} [props.onBlur] - Blur handler function.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {boolean} [props.required=false] - Whether the field is mandatory.
 * @param {boolean} [props.disabled=false] - Disabled state.
 * @param {boolean} [props.readOnly=false] - Read-only state.
 * @param {string} [props.error] - Error message to display.
 * @param {boolean} [props.isInvalid=false] - Explicit invalid flag.
 * @param {string} [props.helperText] - Supplementary hint text displayed beneath the input.
 * @param {React.ReactNode} [props.prefixIcon] - Leading icon/element.
 * @param {React.ReactNode} [props.suffixIcon] - Trailing icon/element.
 * @param {'input'|'textarea'} [props.as='input'] - HTML element to render.
 * @param {number} [props.rows=3] - Number of rows if rendered as textarea.
 * @param {string} [props.className] - Additional wrapper CSS class.
 * @param {string} [props.inputClassName] - Additional input CSS class.
 * @returns {JSX.Element} FormField component.
 */
export const FormField = forwardRef(function FormField(
  {
    id: customId,
    name,
    label,
    type = 'text',
    value = '',
    onChange,
    onBlur,
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    error,
    isInvalid = false,
    helperText,
    prefixIcon,
    suffixIcon,
    as = 'input',
    rows = 3,
    className = '',
    inputClassName = '',
    children,
    ...restProps
  },
  ref
) {
  const generatedId = useId();
  const inputId = customId || `field-${name || generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const hasError = Boolean(isInvalid || error);
  const Component = as === 'textarea' ? 'textarea' : 'input';

  const inputClasses = [
    styles.input,
    as === 'textarea' ? styles.textarea : '',
    prefixIcon ? styles.hasPrefix : '',
    suffixIcon ? styles.hasSuffix : '',
    hasError ? styles.invalidInput : '',
    disabled ? styles.disabled : '',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <div className={styles.labelWrapper}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.requiredAsterisk} aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      <div className={styles.inputContainer}>
        {prefixIcon && <div className={styles.prefixIcon}>{prefixIcon}</div>}

        <Component
          ref={ref}
          id={inputId}
          name={name}
          type={as === 'textarea' ? undefined : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={as === 'textarea' ? rows : undefined}
          className={inputClasses}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          {...restProps}
        >
          {children}
        </Component>

        {suffixIcon && <div className={styles.suffixIcon}>{suffixIcon}</div>}
      </div>

      {hasError && error && (
        <div id={errorId} className={styles.errorText} role="alert">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!hasError && helperText && (
        <div id={helperId} className={styles.helperText}>
          {helperText}
        </div>
      )}
    </div>
  );
});

export default FormField;
