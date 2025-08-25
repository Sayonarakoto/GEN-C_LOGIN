import './Frontpage.css';
import 'boxicons/css/boxicons.min.css';
import { Link } from 'react-router-dom';
function Frontpage() {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Hello, Welcome!</h1>
        <p className="auth-sub">Please select your login type:</p>

        <div className="auth-buttons">
          <Link to="/signin?role=student">
            <button className="btn login-btn">
              <i className="bx bxs-graduation"></i> Student Login
            </button>
          </Link>

          <Link to="/faculty">
            <button className="btn login-btn">
              <i className="bx bxs-user-badge"></i> Faculty Login
            </button>
          </Link>

          <Link to="/signin?role=security">
            <button className="btn login-btn">
              <i className="bx bxs-shield"></i> Security Login
            </button>
          </Link>
        </div>

        <p className="auth-sub">New here?</p>
        <Link to="/regsister">
          <button className="btn register-btn">Register</button>
        </Link>
      </div>
    </div>
  );
}
export default Frontpage;
