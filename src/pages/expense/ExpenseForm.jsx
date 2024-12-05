import React, { useState, useEffect } from "react";
import { auth, db } from "../../utils/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./expense.css";
import toTitleCase from "../../functions/toTitleCase";
import BackNav from "../../components/backNav/BackNav";

export default function ExpenseForm({ userId }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(null);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (!userId) {
      setError("No user ID found.");
      return;
    }

    // Fetch people list from Firestore for the logged-in user
    const fetchPeople = async () => {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const peopleSnapshot = await getDocs(peopleRef);
        const peopleList = peopleSnapshot.docs.map((doc) => doc.data().name);
        setPeople(peopleList.sort()); // Sort alphabetically

        // If no people are added, default to the logged-in user's name
        if (peopleList.length === 0) {
          setPerson(userId); // Assuming userId is the user's name or email
        }
      } catch (error) {
        setError("Error fetching people list.");
      }
    };

    fetchPeople();
  }, [userId]);

  // Fetch total expense for the selected person
  useEffect(() => {
    const fetchTotalExpense = async () => {
      if (!person) return; // If no person is selected, skip fetching

      try {
        const expensesRef = collection(db, "users", userId, "expenses");
        const q = query(expensesRef, where("person", "==", person));
        const expensesSnapshot = await getDocs(q);

        const total = expensesSnapshot.docs.reduce(
          (sum, doc) => sum + doc.data().amount,
          0
        );
        setTotalExpense(total);
      } catch (error) {
        setError("Error fetching total expense.");
      }
    };

    fetchTotalExpense();
  }, [person, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !amount || isNaN(amount) || amount <= 0 || !person) {
      toast.error("Please provide all required fields.");
      return;
    }

    try {
      // Add expense to Firestore
      await addDoc(collection(db, "users", userId, "expenses"), {
        description,
        amount: parseFloat(amount),
        person,
        timestamp: serverTimestamp(),
      });
      toast.success("Expense added successfully!");
      setDescription("");
      setAmount("");
      setPerson("");
    } catch (error) {
      toast.error("Failed to add expense. Please try again.");
    }
  };

  return (
    <>
      <BackNav />
      <div className="expense-form">
        <h2>Add Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="input">
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="input">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="any"
            />
          </div>

          {people.length > 0 ? (
            <div className="input">
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                required
              >
                <option value="">Select a person</option>
                {people.map((p, index) => (
                  <option key={index} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="input">
              {/* <input type="text" value={userId} readOnly /> */}
              <input type="text" value="Self" readOnly />
            </div>
          )}

          {/* Display total expense for the selected person */}
          {person && (
            <div className="total-expense" style={{ marginBottom: "15px" }}>
              <p>
                {/* Total Expense for {person}:{" "} */}
                Total Expense for{" "}
                <strong>
                  {person === auth.currentUser?.uid
                    ? "Self"
                    : toTitleCase(person)}
                </strong>
                :{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "GBP", // Ensure correct currency formatting
                }).format(totalExpense)}
              </p>
            </div>
          )}

          <div className="input">
            <button type="submit">Add Expense</button>
          </div>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </>
  );
}
