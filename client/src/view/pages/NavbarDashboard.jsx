// Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ cartCount }) => {
  const logout = () => {
    localStorage.removeItem("jwtToken");
    console.log("Token removed from local storage."); // Log untuk konfirmasi
    window.location.href = "/login";
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top mb-5 navbar-light bg-light">
      <div className="container px-4 px-lg-5">
        <Link className="navbar-brand" to="/">
          Online Shop
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mx-auto "></ul>
          <form className="d-flex">
            <Link className="btn btn-outline-dark">
              <Link className="nav-link" to="#" onClick={logout}>
                Logout
              </Link>
            </Link>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
