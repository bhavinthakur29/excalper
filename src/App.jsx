import React, { useState, useEffect } from "react";
import "./App.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./utils/firebase.js";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./components/auth/Login.jsx";
import ExpenseList from "./components/expense/ExpenseList.jsx";
import AddExpense from "./components/expense/ExpenseForm.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false after auth check
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

  if (loading) return <div>Loading...</div>; // Show loading while checking auth status

  return (
    <div className="container">
      <ToastContainer position="top-right" autoClose={2500} />
      <Navbar user={user} handleLogout={handleLogout} />
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<ExpenseList userId={user?.uid} />} />
            <Route
              path="/add-expense"
              element={<AddExpense userId={user?.uid} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
