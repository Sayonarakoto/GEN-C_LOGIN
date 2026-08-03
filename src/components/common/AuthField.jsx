import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

const AuthField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  children,
  className,
  inputClassName,
  as,
  options,
}) => {
  return (
    <Form.Group className={`mb-3 ${className || ''}`} controlId={id}>
      {label ? <Form.Label className="field-label">{label}</Form.Label> : null}

      {as === 'select' ? (
        <Form.Select
          value={value}
          onChange={onChange}
          required={required}
          className={inputClassName}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      ) : children ? (
        <InputGroup>
          <Form.Control
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            className={inputClassName}
          />
          {children}
        </InputGroup>
      ) : (
        <Form.Control
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={inputClassName}
        />
      )}
    </Form.Group>
  );
};

export default AuthField;
