const SubmitButton = ({ text, loading = false }) => (
  <button type="submit" disabled={loading} className="login-btn">
    <span>{text}</span>
    {loading && <span className="btn-loader" />}
  </button>
);

export default SubmitButton;
