import React from "react";
import { Link } from "react-router-dom";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Card } from "react-bootstrap";

import logo from '/images/genc-log.jpeg';


function Frontpage() {
  return (
    <div
      className="d-flex flex-column min-vh-100 bg-light"
      style={{ fontFamily: '"Public Sans", "Noto Sans", sans-serif' }}
    >
      {/* Center Content */}
      <div className="container d-flex flex-grow-1 justify-content-center align-items-center">
        <div className="col-lg-6 col-md-8 col-sm-10 w-100">
          <Card className="shadow-sm border-0 rounded-4 p-4">
            {/* LOGO instead of Campus Connect heading */}
            <div className="text-center mb-4">
              <img
                src={logo}
                alt="GEN-C Logo"
                className="img-fluid"
                style={{ maxHeight: "120px" }}
              />
            </div>

            {/* Hero Banner */}
            <div
              className="rounded-4 mb-4"
              style={{
                height: "220px",
                backgroundImage:
                  "linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAxDNRZ7mgdp5NxN_4jW1HxHvjtVdQCkKOcbhVkMhOsXzkDvHz4xozDQg5zNvsPwoRk-yQCoodcGEfXGWqOqVwktw5aEAvgCEH3Mflrqhki1BnRPYyZPaRQv--_zEdIcOYUVFJYAMa42E-DeH3Mflrqhki1BnRPYyZPaRQv--_zEdIcOYUVFJYAMa42E-DeH-bj9f7C8ZPBYDTAnsw5o9gdhr_TEw4uR41ixJl_C4th4iwOzoWNIFz18d_XHp-u1PHqjOd4FpFZslNkH4zlX5OHf91Jv_uOgLVgdOke1Z9uopneREf3oAZKj0DJQ')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="d-flex flex-column justify-content-end h-100 p-3 text-white">
                <h5 className="fw-bold">Welcome to GEN-C</h5>
                <p className="mb-0">Choose your role to log in or register.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-grid gap-3">
              {/* Student */}
              <Link to="/student-login?role=student">
                <Button variant="primary" size="lg" className="w-100">
                  Student Login
                </Button>
              </Link>

              {/* Faculty */}
              <Link to="/faculty-login">
                <Button variant="primary" size="lg" className="w-100">
                  Faculty Login
                </Button>
              </Link>

              {/* Security */}
              <Link to="/security-login">
                <Button variant="primary" size="lg" className="w-100">
                  Security Staff Login
                </Button>
              </Link>

              {/* Register */}
              <Link to="/register">
                <Button size="lg" className="w-100 bg-light text-dark fw-bold">
                  Register
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Frontpage;