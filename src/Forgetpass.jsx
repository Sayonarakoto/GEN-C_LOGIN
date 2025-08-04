import React from "react";

function Forgetpass() {
  return (
    <div className="container">
      <div className="row min-vh-100 justify-content-center align-items-center">
        <div className="col-md-6">
          <form action="" method="post">
            <h1 className="mb-4 text-center">FORGOT PASSWORD</h1>

            <div className="mb-3 row align-items-center">
              <label htmlFor="newPassword" className="col-sm-4 col-form-label">
                New Password
              </label>
              <div className="col-sm-8">
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div className="mb-3 row align-items-center">
              <label htmlFor="confirmPassword" className="col-sm-4 col-form-label">
                Confirm Password
              </label>
              <div className="col-sm-8">
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success w-100">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Forgetpass;
