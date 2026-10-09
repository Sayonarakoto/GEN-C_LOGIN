import './ErrorState.css';

const ErrorState = ({
  title,
  subtitle,
  image,
  imageAlt = '',
  actionLabel = 'Go to Homepage',
  onAction,
}) => (
  <div className="error-state-bg">
    <div className="error-state-card">
      <h2 className="error-state-title">{title}</h2>
      <p className="error-state-subtitle">{subtitle}</p>

      {image && <img src={image} alt={imageAlt} className="error-state-image" />}

      {actionLabel && onAction && (
        <button type="button" className="error-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
