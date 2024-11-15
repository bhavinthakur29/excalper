import React, { useState } from "react";
import { auth, db } from "../../utils/firebase"; // Ensure db is imported
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore"; // Import Firestore methods
import { toast } from "react-toastify";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Added name state for registration
  const [isRegister, setIsRegister] = useState(false);
  const [visibility, setVisibility] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully");
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
      const userRef = collection(db, "users"); // Get users collection
      await addDoc(userRef, {
        email: user.email,
        name: name, // Store the name in Firestore
        uid: user.uid, // Store the user UID as well
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
            <>
              Don't have an account?
              <span className="switch-btn">Register</span>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
