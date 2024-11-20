import React, { useEffect, useState } from "react";
import { auth, db } from "../../utils/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import "./expense.css";
import Loading from "../loadingSpinner/Loading";
import { Link } from "react-router-dom";
import toTitleCase from "../../functions/toTitleCase";

export default function ExpenseList({ userId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [updatedAmount, setUpdatedAmount] = useState("");

  useEffect(() => {
    if (!userId) {
      setError("No user ID found.");
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", userId, "expenses"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expensesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp
            ? data.timestamp.toDate() // Use Firestore's timestamp field
            : new Date();

          return {
            ...data,
            id: doc.id,
            date: timestamp,
          };
        });

        expensesData.sort((a, b) => b.date - a.date); // Sort by date (most recent first)

        setExpenses(expensesData);
        setLoading(false);

        const grouped = expensesData.reduce((acc, expense) => {
          const month = expense.date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          if (!acc[month]) {
            acc[month] = [];
          }
          acc[month].push(expense);
          return acc;
        }, {});

        setGroupedExpenses(grouped);

        const total = expensesData.reduce(
          (sum, expense) => parseFloat(sum) + parseFloat(expense.amount),
          0
        );
        setTotalAmount(total);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setUpdatedDescription(expense.description);
    setUpdatedAmount(expense.amount);
  };

  const handleUpdateExpense = async () => {
    if (editingExpense) {
      const expenseRef = doc(
        db,
        "users",
        userId,
        "expenses",
        editingExpense.id
      );
      await updateDoc(expenseRef, {
        description: updatedDescription,
        amount: updatedAmount,
      });

      setEditingExpense(null);
      setUpdatedDescription("");
      setUpdatedAmount("");
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setUpdatedDescription("");
    setUpdatedAmount("");
  };

  if (loading) return <Loading />;
  if (error) return <div className="expense-list">Error: {error}</div>;

  return (
    <div className="expense-list">
      <div className="add-new-expense">
        <Link to="/add-expense">
          <i className="fa-solid fa-plus"></i>
        </Link>
      </div>
      {Object.keys(groupedExpenses).map((month) => (
        <div className="main" key={month}>
          <h3>{month}</h3>
          {groupedExpenses[month].map((expense) => (
            <div className="item" key={expense.id}>
              <div className="details">
                <p className="description">{expense.description}</p>
                <p className="price">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "GBP", // Ensure correct currency formatting
                  }).format(expense.amount)}
                </p>
              </div>

              <p className="person">
                For:{" "}
                {expense.person === auth.currentUser?.uid
                  ? "Self"
                  : toTitleCase(expense.person)}
              </p>

              <p className="date">
                <span>
                  {/* Format the date based on Firestore timestamp */}
                  {expense.date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true, // Ensure the time is in 12-hour format (AM/PM)
                  })}
                </span>
                <button onClick={() => handleEditClick(expense)}>
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              </p>
            </div>
          ))}
        </div>
      ))}

      {editingExpense && (
        <div className="edit-modal">
          <h3>Edit Expense</h3>
          <label>Description</label>
          <input
            type="text"
            value={updatedDescription}
            onChange={(e) => setUpdatedDescription(e.target.value)}
          />
          <label>Amount</label>
          <input
            type="number"
            value={updatedAmount}
            onChange={(e) => setUpdatedAmount(Number(e.target.value))}
          />
          <div className="btn-group">
            <button onClick={handleUpdateExpense}>Update</button>
            <button onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      <div className="total">
        <p>Total Amount:</p>
        <p>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "GBP", // Ensure correct currency formatting
          }).format(totalAmount)}
        </p>
      </div>
    </div>
  );
}
