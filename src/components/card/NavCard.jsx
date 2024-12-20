import React from "react";
import "./navcard.css";
import { useNavigate } from "react-router-dom";

const NavCard = (props) => {
  const navigate = useNavigate();
  return (
    <div className="nav-card" onClick={() => navigate(props.link)}>
      <div className="icon" style={props.decor || { color: "black" }}>
        <i className={props.icon} />
      </div>
      <div className="page-name" style={props.decor}>
        {props.name}
      </div>
    </div>
  );
};

export default NavCard;
