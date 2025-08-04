import './Frontpage.css';
import 'boxicons/css/boxicons.min.css';
function Frontpage() {
  return (
    <>
      <div className="container">
        <div className="form-box login">
          <div className="toggle-box">
            <div className="toggle-panel toggle-left">
              <h1>Hello, Welcome!</h1>
              <p>Don't have an account?</p>
              <button className="btn register-btn">Register</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Welcome Back!</h1>
              <p>Already have an account?</p>
              <button className="btn login-btn">Login</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Frontpage;