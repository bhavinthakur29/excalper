import React, { useState, useEffect } from "react";
import { auth, db } from "../../utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./myProfile.css";
import BackNav from "../../components/backNav/BackNav";
import { fetchUserName } from "../../functions/fetchUserName";

export default function MyProfile() {
  const [userName, setUserName] = useState(""); // State to store the user's name
  const [isEditing, setIsEditing] = useState(false); // Toggle for edit mode
  const [loading, setLoading] = useState(false);
  const [userDocId, setUserDocId] = useState(null); // Store Firestore document ID

  useEffect(() => {
    fetchUserName(setUserName, setUserDocId); // Pass the state setters here
  }, []);

  const handleEditProfile = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Save the updated name
    try {
      if (!userName.trim()) {
        toast.error("Name cannot be empty.");
        return;
      }

      setLoading(true);
      const userRef = doc(db, "users", userDocId);
      await updateDoc(userRef, { name: userName });

      toast.success("Profile updated successfully.");
      setIsEditing(false); // Exit edit mode
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackNav />
      <div className="my-profile">
        <h2>My Profile</h2>

        <div className="main">
          <div className="profile-photo">
            <div>
              <img
                src="https://avatar.iran.liara.run/public/boy"
                alt="User Profile"
              />
            </div>
          </div>

          <div className="divider"></div>

          <div className="profile-details">
            <form>
              {/* Name Field */}
              <div className="name">
                <input
                  type="text"
                  value={userName}
                  placeholder="Name"
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={!isEditing}
                  className={isEditing ? "editable" : ""}
                />
              </div>

              {/* Email Field */}
              <div className="email">
                <input
                  type="email"
                  value={auth.currentUser?.email || "Email not available"}
                  disabled
                />
              </div>
            </form>

            {/* Edit Profile Button */}
            <button onClick={handleEditProfile} disabled={loading}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
