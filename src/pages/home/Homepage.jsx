import React, { useState, useEffect } from "react";
import "./homepage.css";
import NavCard from "../../components/card/NavCard";
import {fetchUserName} from "../../functions/fetchUserName";

const Homepage = () => {
  const [userName, setUserName] = useState("");
  const [userDocId, setUserDocId] = useState(null);

  useEffect(() => {
    fetchUserName(setUserName, setUserDocId);
  }, []);

  return (
    <>
      <h2 className="user-welcome">
        Welcome, <br className="phone-only" />{" "}
        <span style={{ color: "#eb0000" }}>{userName}</span>
      </h2>
      <div className="homepage">
        <div className="homepage-content">
          <NavCard
            link="/expenses"
            className="nav-card"
            icon="fa fa-list"
            name="My Expenses"
            decor={{ color: "blue" }}
          />
          <NavCard
            link="/add-expense"
            className="nav-card"
            icon="fa fa-plus"
            name="Add Expense"
            decor={{ color: "red" }}
          />
          <NavCard
            link="/users"
            className="nav-card"
            icon="fa-solid fa-user-plus"
            name="Add User"
            decor={{ color: "#ffb319" }}
          />
          <span className="phone-only">
            <NavCard
              link="/settings"
              className="nav-card"
              icon="fa-solid fa-gear"
              name="Settings"
              decor={{ color: "green" }}
            />
          </span>
        </div>
      </div>
    </>
  );
};

export default Homepage;
