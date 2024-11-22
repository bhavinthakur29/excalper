import React, { useState, useEffect } from "react";
import { db } from "../../utils/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import "./contribution.css";

const Contribution = ({ userId }) => {
  const [expenses, setExpenses] = useState([]);
  const [outstanding, setOutstanding] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchExpenses = async () => {
      try {
        const expensesRef = collection(db, "users", userId, "expenses");
        const expensesSnapshot = await getDocs(expensesRef);
        const expensesData = expensesSnapshot.docs.map((doc) => doc.data());

        console.log("Fetched Expenses:", expensesData); // Debug log
        setExpenses(expensesData);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      }
    };

    fetchExpenses();
  }, [userId]);

  const calculateOutstanding = () => {
    if (!expenses.length) {
      console.log("No expenses to process.");
      return;
    }

    // Calculate total expense and the per-person share
    const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const uniquePeople = [...new Set(expenses.map((exp) => exp.person))];

    console.log("Unique People:", uniquePeople); // Debug log

    const sharePerPerson = totalExpense / uniquePeople.length;

    // Calculate outstanding amounts
    const contributions = uniquePeople.map((person) => {
      const totalContributed = expenses
        .filter((exp) => exp.person === person)
        .reduce((acc, exp) => acc + exp.amount, 0);
      const balance = totalContributed - sharePerPerson;

      return {
        name: person,
        balance,
      };
    });

    console.log("Contributions:", contributions); // Debug log

    // Categorize contributions into "has to give" or "will take"
    const calculatedOutstanding = contributions.map((contribution) => ({
      ...contribution,
      status:
        contribution.balance > 0
          ? `will take £${Math.abs(contribution.balance).toFixed(2)}`
          : `has to give £${Math.abs(contribution.balance).toFixed(2)}`,
    }));

    console.log("Calculated Outstanding:", calculatedOutstanding); // Debug log

    setOutstanding(calculatedOutstanding);
  };

  return (
    <div className="contribution">
      <h2>User Contributions</h2>
      <button className="calculate-btn" onClick={calculateOutstanding}>
        Calculate Outstanding
      </button>

      {outstanding.length > 0 ? (
        <ul className="outstanding-list">
          {outstanding.map((user) => (
            <li key={user.name} className="outstanding-item">
              <span className="person-name">{user.name}</span>
              <span className="person-status">{user.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No data available. Click "Calculate Outstanding" to start.</p>
      )}
    </div>
  );
};

export default Contribution;
