import React, { useState } from "react";
import "./settings.css";
import NavCard from "../../components/card/NavCard";
import BackNav from "../../components/backNav/BackNav";
import Modal from "../../components/modal/Modal";

const Settings = ({ handleLogout }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    setIsLogoutModalOpen(false); // Close the modal before logging out
    handleLogout(); // Call the logout function
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <BackNav />
      <div className="settings">
        <div className="settings-content">
          {/* My Profile */}
          <NavCard
            link="/settings/my-profile"
            className="nav-card"
            icon="fa fa-user"
            name="My Profile"
          />

          {/* Manage Password */}
          <NavCard
            link="/settings/manage-password"
            className="nav-card"
            icon="fa-solid fa-key"
            name="Manage Password"
          />

          {/* Logout Button for Mobile */}
          <div className="phone-only">
            <div
              className="logout-nav-card"
              onClick={openLogoutModal}
              style={{ cursor: "pointer" }}
            >
              <NavCard
                className="nav-card"
                icon="fa-solid fa-right-from-bracket"
                name="Logout"
                decor={{ color: "red" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <Modal
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={closeLogoutModal}
          cancelBtn={true}
        />
      )}
    </>
  );
};

export default Settings;
