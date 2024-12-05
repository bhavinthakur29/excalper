import React from "react";
import "./backnav.css";
import { useNavigate } from "react-router-dom";

const BackNav = () => {
  const navigate = useNavigate();
  const handleBackNav = () => {
    navigate(-1);
  };

  return (
    <div className="backNav">
      <button onClick={handleBackNav}>
        <i className="fa-solid fa-angle-left" id="goBack" />
        <span>Go Back</span>
      </button>
    </div>
  );
};

export default BackNav;
