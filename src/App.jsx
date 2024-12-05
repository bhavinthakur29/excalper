import React, { useState, useEffect } from "react";
import "./App.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./utils/firebase.js";
import Navbar from "./components/navbar/Navbar.jsx";
import Login from "./pages/auth/Login.jsx";
import ExpenseList from "./pages/expense/ExpenseList.jsx";
import AddExpense from "./pages/expense/ExpenseForm.jsx";
import Settings from "./pages/settings/Settings.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "./components/loadingSpinner/Loading.jsx";
import Homepage from "./pages/home/Homepage.jsx";
import MyUsers from "./pages/users/MyUsers.jsx";
import PasswordReset from "./components/passwordReset/PasswordReset.jsx";
import Contribution from "./components/contribution/Contribution.jsx";
import MyProfile from "./pages/myProfile/MyProfile.jsx";
import Footer from "./components/footer/Footer.jsx";
import ManagePassword from "./pages/changePassword/ManagePassword.jsx";

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
    <div className="">
      <ToastContainer position="top-right" autoClose={2500} />
      <Navbar user={user} handleLogout={handleLogout} />
      <div className="container">
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
                path="/settings"
                element={
                  <Settings userId={user?.uid} handleLogout={handleLogout} />
                } // Pass userId
              />
              <Route
                path="/settings/my-profile"
                element={<MyProfile userId={user?.uid} />}
              />
              <Route
                path="/settings/manage-password"
                element={<ManagePassword userId={user?.uid} />}
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
      <Footer />
    </div>
  );
}

export default App;
