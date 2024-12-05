import React, { useState } from "react";
import { auth, db } from "../../utils/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"; // Import Firestore methods
import { toast } from "react-toastify";
import "./login.css";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Added name state for registration
  const [isRegister, setIsRegister] = useState(false);
  const [visibility, setVisibility] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Fetch the user's name from Firestore
      const userRef = collection(db, "users");
      const q = query(userRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        toast.success(`Welcome, ${userData.name}`);
      } else {
        toast.success("Logged in successfully!");
      }
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        toast.error("Invalid credentials!");
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Register the user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save the user's name and email in Firestore
      const userRef = collection(db, "users");
      await addDoc(userRef, {
        email: user.email,
        name: name,
        uid: user.uid,
      });

      toast.success("Account created successfully");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already in use!");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error("Failed to create an account. Please try again.");
      }
    }
  };

  return (
    <div className="login">
      <form onSubmit={isRegister ? handleRegister : handleLogin}>
        <h2>{isRegister ? "Register" : "Login"}</h2>
        {isRegister && (
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type={visibility ? "text" : "password"}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="pass-visibility">
          <label className="checkbox">
            Show password
            <input
              type="checkbox"
              onChange={() => setVisibility(!visibility)}
            />
            <span className="checkmark"></span>
          </label>
        </div>
        <button type="submit">{isRegister ? "Register" : "Login"}</button>
        <p onClick={() => setIsRegister(!isRegister)} className="toggle-link">
          {isRegister ? (
            <>
              Already have an account?
              <span className="switch-btn">Log in</span>
            </>
          ) : (
            <span className="login-bottom">
              <span>
                Don't have an account?
                <span className="switch-btn">Register</span>
              </span>
              <span className="pass-reset">
                Forgot password? <Link to="/password-reset">Click here</Link>
              </span>
            </span>
          )}
        </p>
      </form>
    </div>
  );
}
