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
  const [paymentMode, setPaymentMode] = useState(""); // New state for payment mode
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(null);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (!userId) {
      setError("No user ID found.");
      return;
    }

    const fetchPeople = async () => {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const peopleSnapshot = await getDocs(peopleRef);
        const peopleList = peopleSnapshot.docs.map((doc) => doc.data().name);
        setPeople(peopleList.sort());
        if (peopleList.length === 0) {
          setPerson(userId);
        }
      } catch (error) {
        setError("Error fetching people list.");
      }
    };

    fetchPeople();
  }, [userId]);

  useEffect(() => {
    const fetchTotalExpense = async () => {
      if (!person) return;
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

    if (
      !description ||
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      !person ||
      !paymentMode // Ensure payment mode is selected
    ) {
      toast.error("Please provide all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "users", userId, "expenses"), {
        description,
        amount: parseFloat(amount),
        person,
        paymentMode, // Store payment mode
        timestamp: serverTimestamp(),
      });
      toast.success("Expense added successfully!");
      setDescription("");
      setAmount("");
      setPerson("");
      setPaymentMode(""); // Reset payment mode
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
              <input type="text" value="Self" readOnly />
            </div>
          )}

          <div className="input">
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              required
            >
              <option value="" disabled>
                Select payment mode
              </option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="net banking">Net Banking</option>
            </select>
          </div>

          {person && (
            <div className="total-expense" style={{ marginBottom: "15px" }}>
              <p>
                Total Expense for{" "}
                <strong>
                  {person === auth.currentUser?.uid
                    ? "Self"
                    : toTitleCase(person)}
                </strong>
                :{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "GBP",
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
