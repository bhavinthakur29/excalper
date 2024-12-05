import React, { useEffect, useState } from "react";
import { auth, db } from "../../utils/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import "./expense.css";
import Loading from "../../components/loadingSpinner/Loading";
import { Link } from "react-router-dom";
import toTitleCase from "../../functions/toTitleCase";
import Modal from "../../components/modal/Modal";
import { toast } from "react-toastify";
import BackNav from "../../components/backNav/BackNav";

export default function ExpenseList({ userId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [updatedAmount, setUpdatedAmount] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(""); // Added for sorting by month
  const [selectedPerson, setSelectedPerson] = useState(""); // Added for sorting by person
  const [people, setPeople] = useState([]); // List of people

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
            ? data.timestamp.toDate()
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

        // Extract unique people from the expenses
        const peopleSet = new Set();
        expensesData.forEach((expense) => {
          peopleSet.add(expense.person);
        });

        setPeople([...peopleSet]);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleSortChange = (e) => {
    const { name, value } = e.target;
    if (name === "month") {
      setSelectedMonth(value);
    } else if (name === "person") {
      setSelectedPerson(value);
    }
  };

  const filteredGroupedExpenses = Object.entries(groupedExpenses).reduce(
    (acc, [month, expensesList]) => {
      const filteredExpenses = expensesList.filter((expense) => {
        // Filter by month and person
        const matchesMonth = !selectedMonth || month.includes(selectedMonth);
        const matchesPerson =
          !selectedPerson || expense.person === selectedPerson;

        return matchesMonth && matchesPerson;
      });

      if (filteredExpenses.length > 0) {
        acc[month] = filteredExpenses;
      }
      return acc;
    },
    {}
  );

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

  const handleDeleteExpense = async () => {
    if (editingExpense) {
      try {
        const expenseRef = doc(
          db,
          "users",
          userId,
          "expenses",
          editingExpense.id
        );
        await deleteDoc(expenseRef);
        setEditingExpense(null);
        setConfirmDeleteVisible(false);
        setUpdatedDescription("");
        setUpdatedAmount("");
        toast.success("Expense deleted successfully");
      } catch (error) {
        setError("Failed to delete expense. Please try again.");
        toast.error("Some error occurred");
      }
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="expense-list">Error: {error}</div>;

  return (
    <>
      <BackNav />
      <div className="expense-list">
        <div className="add-new-expense">
          <Link to="/add-expense">
            <i className="fa-solid fa-plus"></i>
          </Link>
        </div>
        <div className="sort">
          <span>Show expenses of </span>

          <select
            name="person"
            value={selectedPerson}
            onChange={handleSortChange}
          >
            <option value="">All users</option>
            {people.map((person) => (
              <option key={person} value={person}>
                {toTitleCase(person)}
              </option>
            ))}
          </select>
          <span>in</span>
          <select
            name="month"
            value={selectedMonth}
            onChange={handleSortChange}
          >
            <option value="">All months</option>
            {Object.keys(groupedExpenses).map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        {Object.keys(filteredGroupedExpenses).map((month) => {
          const monthTotal = filteredGroupedExpenses[month].reduce(
            (total, expense) => total + parseFloat(expense.amount),
            0
          );

          return (
            <div className="main" key={month}>
              <h3 className="month">
                <span>{month}</span>
                <span>
                  Total:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "GBP",
                  }).format(monthTotal)}
                  
                </span>
              </h3>
              {filteredGroupedExpenses[month].map((expense) => (
                <div className="item" key={expense.id}>
                  <div className="details">
                    <p className="description">
                      {toTitleCase(expense.description)}
                    </p>
                    <p className="price">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "GBP",
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
                      {expense.date.toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <button onClick={() => handleEditClick(expense)}>
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </p>
                </div>
              ))}
            </div>
          );
        })}

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
              <button className="update-btn" onClick={handleUpdateExpense}>
                Update
              </button>
              <button className="cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={() => setConfirmDeleteVisible(true)}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {confirmDeleteVisible && (
          <Modal
            title="Confirm Deletion"
            content="Are you sure you want to delete this expense?"
            onConfirm={handleDeleteExpense}
            onCancel={() => setConfirmDeleteVisible(false)}
          />
        )}
        <div className="total">
          <h3>Total Amount</h3>
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "GBP",
            }).format(totalAmount)}
          </p>
        </div>
      </div>
    </>
  );
}
