import React, { useState, useEffect } from "react";
import { db } from "../../utils/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./myUsers.css";
import toTitleCase from "../../functions/toTitleCase";

const MyUsers = ({ userId }) => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState("");
  const [error, setError] = useState(null);
  const [peopleWithExpenses, setPeopleWithExpenses] = useState({});

  useEffect(() => {
    if (!userId) {
      setError("No user ID found.");
      return;
    }

    // Fetch people list from Firestore
    const fetchPeople = async () => {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const peopleSnapshot = await getDocs(peopleRef);
        const peopleList = peopleSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setPeople(peopleList.sort((a, b) => a.name.localeCompare(b.name)));

        // Fetch total expenses for each person
        peopleList.forEach(async (person) => {
          await fetchTotalExpenses(person.name);
        });
      } catch (err) {
        setError("Error fetching users.");
      }
    };

    fetchPeople();
  }, [userId]);

  // Fetch total expenses for a person
  const fetchTotalExpenses = async (person) => {
    try {
      const expensesRef = collection(db, "users", userId, "expenses");
      const expensesQuery = query(expensesRef, where("person", "==", person));

      const expensesSnapshot = await getDocs(expensesQuery);
      const totalExpenses = expensesSnapshot.docs.reduce(
        (acc, doc) => acc + doc.data().amount,
        0
      );

      setPeopleWithExpenses((prevState) => ({
        ...prevState,
        [person]: totalExpenses,
      }));
    } catch (error) {
      toast.error(`Error fetching expenses for ${person}.`);
    }
  };

  // To Capitalize the name

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (newPerson.trim() && !people.some((p) => p.name === newPerson)) {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const docRef = await addDoc(peopleRef, {
          name: newPerson,
          timestamp: serverTimestamp(),
        });
        setPeople((prevPeople) =>
          [...prevPeople, { id: docRef.id, name: newPerson }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setNewPerson("");
        toast.success("Person added successfully!");
        fetchTotalExpenses(newPerson); // Fetch total expenses for newly added person
      } catch (error) {
        toast.error("Failed to add person. Please try again.");
      }
    } else {
      toast.error("Please enter a valid, unique name.");
    }
  };

  const handleDeletePerson = async (person) => {
    const totalExpenses = peopleWithExpenses[person.name] || 0;

    // First confirmation for deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${person.name}?`
    );
    if (!confirmDelete) return;

    // Second confirmation if the person has non-zero total expenses
    if (totalExpenses > 0) {
      const confirmExpenseDelete = window.confirm(
        `${person.name} has total expenses of £${totalExpenses.toFixed(
          2
        )}. Are you sure you want to delete this user?`
      );
      if (!confirmExpenseDelete) return;
    }

    try {
      // Delete person from Firestore
      const personDoc = doc(db, "users", userId, "people", person.id);
      await deleteDoc(personDoc);

      // Optionally delete associated expenses
      const expensesRef = collection(db, "users", userId, "expenses");
      const expensesQuery = query(
        expensesRef,
        where("person", "==", person.name)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const deletePromises = expensesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      setPeople((prevPeople) => prevPeople.filter((p) => p.id !== person.id));
      toast.success(`${person.name} and their associated data were deleted.`);
    } catch (error) {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="my-users">
      <h2>My Users</h2>
      <div className="add-person-section">
        <form onSubmit={handleAddPerson}>
          <input
            type="text"
            placeholder="New Person Name"
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
          />
          <input type="submit" value="Add Person" />
        </form>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="people-section">
        <h3>People Added</h3>
        {people.length === 0 ? (
          <p>No people added yet.</p>
        ) : (
          <ul className="people-list">
            <li className="list-headings">
              <span className="person-name">Name</span>
              <span className="total-expenses">Amt</span>
            </li>
            {people.map((person) => (
              <li key={person.id}>
                <span className="list-style">
                  <i className="fa-solid fa-caret-right"></i>
                </span>
                <span className="person-name">{toTitleCase(person.name)}</span>
                <span className="total-expenses">
                  {peopleWithExpenses[person.name]
                    ? `£${peopleWithExpenses[person.name].toFixed(2)}`
                    : "£0"}
                </span>
                <button
                  className="delete-button"
                  onClick={() => handleDeletePerson(person)}
                >
                  <i className="fa fa-trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyUsers;
