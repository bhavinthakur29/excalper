import React, { useState, useEffect } from "react";
import "./App.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./utils/firebase.js";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./components/auth/Login.jsx";
import ExpenseList from "./components/expense/ExpenseList.jsx";
import AddExpense from "./components/expense/ExpenseForm.jsx";
import ProfilePage from "./components/profile/ProfilePage.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "./components/loadingSpinner/Loading.jsx";
import Homepage from "./components/home/Homepage.jsx";
import MyUsers from "./components/users/MyUsers.jsx";
import PasswordReset from "./components/passwordReset/PasswordReset.jsx";
import Contribution from "./components/contribution/Contribution.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <ToastContainer position="top-right" autoClose={2500} />
      <Navbar user={user} handleLogout={handleLogout} />
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Homepage />} />
            <Route
              path="/users"
              element={<MyUsers userId={user?.uid} />}
            />{" "}
            {/* Pass userId */}
            <Route
              path="/expenses"
              element={<ExpenseList userId={user?.uid} />} // Pass userId
            />
            <Route
              path="/add-expense"
              element={<AddExpense userId={user?.uid} />} // Pass userId
            />
            <Route
              path="/profile"
              element={<ProfilePage userId={user?.uid} />} // Pass userId
            />
            <Route path="/users/contribution" element={<Contribution />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
