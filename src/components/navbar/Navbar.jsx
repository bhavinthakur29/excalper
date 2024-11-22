import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";
import Modal from "../modal/Modal";

function Navbar({ user, handleLogout }) {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    handleLogout(); // Call the provided handleLogout function
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo" onClick={() => navigate("/")}>
          Expense Calculator
        </div>
        <div className="navbar-links">
          <ul>
            {user ? (
              <>
                <li className="home">
                  <Link to="/expenses" aria-label="Go to home page">
                    <i className="fa-solid fa-list-ul"></i>
                    <span>My Expenses</span>
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
                <li className="profile-page">
                  <Link to="/users" aria-label="Profile">
                    <i className="fa-solid fa-users"></i>
                    <span>My Users</span>
                  </Link>
                  <div className="underline"></div>
                </li>
                <li className="profile-page">
                  <Link to="/profile" aria-label="Profile">
                    <i className="fa-solid fa-user"></i>
                    <span>Profile</span>
                  </Link>
                  <div className="underline"></div>
                </li>
                <li>
                  <button
                    className="logout-btn"
                    onClick={() => setIsLogoutModalOpen(true)}
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

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <Modal
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          cancelBtn={true}
        />
      )}
    </nav>
  );
}

export default Navbar;
