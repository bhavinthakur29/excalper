import React, { useState } from "react";
import { auth } from "../../utils/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { toast } from "react-toastify";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await createUserWithEmailAndPassword(auth, email, password);
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
              required
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
