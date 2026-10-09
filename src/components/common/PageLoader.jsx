import './PageLoader.css';

const PageLoader = ({ label = 'Loading...' }) => (
  <div className="page-loader" role="status" aria-live="polite">
    <span className="page-loader-spinner" aria-hidden="true" />
    <span className="page-loader-label">{label}</span>
  </div>
);

export default PageLoader;
