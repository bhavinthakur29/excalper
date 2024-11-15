import React from "react";
import "./homepage.css";
import NavCard from "../card/NavCard";

const Homepage = () => {
  return (
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
          link="/profile"
          className="nav-card"
          icon="fa fa-user"
          name="Profile"
          decor={{ color: "green" }}
        />
      </div>
    </div>
  );
};

export default Homepage;
