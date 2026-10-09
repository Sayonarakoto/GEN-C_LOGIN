import './LoginPage.css';
import '../../Pages/Auth.css';

const AuthShell = ({ brand, form, visual, compact }) => {
  if (compact) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-container auth-compact">
          {brand}
          {form}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="login-split">
        <div className="login-form-side">
          {brand}
          {form}
        </div>
        {visual}
      </div>
    </div>
  );
};

export default AuthShell;
