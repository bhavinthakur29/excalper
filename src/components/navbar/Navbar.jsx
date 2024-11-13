import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

function Navbar({ user, handleLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">Expense Calculator</div>
        <div className="navbar-links">
          <ul>
            {user ? (
              <>
                <li className="home">
                  <Link to="/" aria-label="Go to home page">
                    <i className="fa-solid fa-list-ul"></i>
                    <span>Home</span>
                  </Link>
                  <div className="underline"></div>
                </li>
                <li className="add">
                  <Link to="/add-expense" aria-label="Add a new expense">
                    <i className="fa-solid fa-plus"></i>
                    <span>Add Expense</span>
                  </Link>
                  <div className="underline"></div>
                </li>
                <li>
                  <button
                    className="logout-btn"
                    onClick={handleLogout}
                    aria-label="Logout from the application"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Logout</span>
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" aria-label="Login to your account">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
