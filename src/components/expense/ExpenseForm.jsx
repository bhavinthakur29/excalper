import React, { useState } from "react";
import { db } from "../../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import "./expense.css";

export default function ExpenseForm({ userId }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("Rishang");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !amount || isNaN(amount) || amount <= 0) {
      toast.error("Please provide a valid description and amount.");
      return;
    }

    try {
      await addDoc(collection(db, "expenses"), {
        userId,
        description,
        amount: parseFloat(amount),
        person,
        timestamp: serverTimestamp(),
      });
      toast.success("Expense added successfully!");
      setDescription("");
      setAmount("");
      setPerson(person);
    } catch (error) {
      toast.error("Failed to add expense. Please try again.");
    }
  };

  return (
    <div className="expense-form">
      <h2>Add Expense</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="group">
          <div>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
            />
          </div>
          <div>
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              required
            >
              <option value="Bhavin">Bhavin</option>
              <option value="Rajesh">Rajesh</option>
              <option value="Rishang">Rishang</option>
            </select>
          </div>
          <div>
            <button type="submit">Add Expense</button>
          </div>
        </div>
      </form>
    </div>
  );
}
