const BrandMark = ({ icon, title, subtitle }) => (
  <div className="brand-block text-center">
    <div className="brand-mark">{icon}</div>
    <h1 className="login-title">{title}</h1>
    <p className="login-subtitle">{subtitle}</p>
  </div>
);

export default BrandMark;
