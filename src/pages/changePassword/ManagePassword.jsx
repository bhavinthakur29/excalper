import React, { useState } from "react";
import "./managePassword.css";
import { auth } from "../../utils/firebase";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from "react-toastify";
import BackNav from "../../components/backNav/BackNav";

export default function ManagePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both current and new passwords.");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        toast.error("New password is too weak. Choose a stronger password.");
      } else {
        toast.error("Failed to change password. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const ask = confirm("Please confirm if you want a password reset email.");
      if (ask == true) {
        toast.success("Email sent! Please check your inbox.");
        await sendPasswordResetEmail(auth, auth.currentUser.email);
      }
    } catch (error) {
      toast.error("Failed to send reset email. Try again.");
    }
  };

  return (
    <>
      <BackNav />
      <div className="manage-password">
        <h2>Manage Your Password</h2>
        <p>
          Password reset requests will be sent to -- {auth.currentUser?.email}
        </p>
        <div className="main">
          <div className="change-pass">
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <div>
                <input
                  type={visibility ? "text" : "password"}
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type={visibility ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pass-visibility">
                <label className="checkbox">
                  Show password
                  <input
                    type="checkbox"
                    onChange={() => setVisibility(!visibility)}
                    required
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>

          <div className="divider"></div>

          <div className="reset-pass">
            <h3>Reset Password</h3>
            <p>
              Click the button below to get a{" "}
              <span style={{ color: "red" }}>password reset</span> email to your
              registered email address.
            </p>
            <button onClick={handleResetPassword} disabled={loading}>
              Send Password Reset Email
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
