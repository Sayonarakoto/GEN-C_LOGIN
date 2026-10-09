import { Eye, EyeSlash } from 'react-bootstrap-icons';

const FormField = ({ field, value, onChange, revealed, onToggleReveal, disabled }) => {
  const isPassword = field.type === 'password';

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={field.name}>
        {field.label}
      </label>
      <div className={isPassword ? 'relative' : undefined}>
        <input
          id={field.name}
          type={isPassword && !revealed ? 'password' : 'text'}
          className={isPassword ? 'glass-input has-eye' : 'glass-input'}
          placeholder={field.placeholder || (isPassword ? '••••••••' : '')}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          autoComplete={field.autoComplete || (isPassword ? 'current-password' : 'username')}
          required
          disabled={disabled}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleReveal}
            className="eye-icon"
            disabled={disabled}
            aria-label={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormField;
