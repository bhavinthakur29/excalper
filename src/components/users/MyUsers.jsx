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
import Modal from "../modal/Modal";

const MyUsers = ({ userId }) => {
  const [people, setPeople] = useState([]);
  const [newPerson, setNewPerson] = useState("");
  const [error, setError] = useState(null);
  const [peopleWithExpenses, setPeopleWithExpenses] = useState({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    person: null,
    message: "",
  });
  const [infoModalState, setInfoModalState] = useState({
    isOpen: false,
    message: "",
  });

  // Fetch people and their expenses
  useEffect(() => {
    if (!userId) {
      setError("No user ID found.");
      return;
    }

    const fetchPeople = async () => {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const peopleSnapshot = await getDocs(peopleRef);
        const peopleList = peopleSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setPeople(peopleList.sort((a, b) => a.name.localeCompare(b.name)));

        peopleList.forEach(async (person) => {
          await fetchTotalExpenses(person.name);
        });
      } catch (err) {
        setError("Error fetching users.");
      }
    };

    fetchPeople();
  }, [userId]);

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

  const handleAddPerson = async (e) => {
    e.preventDefault();
    const formattedPerson = toTitleCase(newPerson.trim());
    if (formattedPerson && !people.some((p) => p.name === formattedPerson)) {
      try {
        const peopleRef = collection(db, "users", userId, "people");
        const docRef = await addDoc(peopleRef, {
          name: formattedPerson,
          timestamp: serverTimestamp(),
        });

        setPeople((prevPeople) =>
          [...prevPeople, { id: docRef.id, name: formattedPerson }].sort(
            (a, b) => a.name.localeCompare(b.name)
          )
        );
        setNewPerson("");
        toast.success("Person added successfully!");
        fetchTotalExpenses(formattedPerson);
      } catch (error) {
        toast.error("Failed to add person. Please try again.");
      }
    } else {
      toast.error("Please enter a valid, unique name.");
    }
  };

  const confirmDeletePerson = (person) => {
    const totalExpenses = peopleWithExpenses[person.name] || 0;
    const message =
      totalExpenses > 0
        ? `${person.name} has total expenses of £${totalExpenses.toFixed(
            2
          )}. Are you sure you want to delete this user?`
        : ` Are you sure you want to delete ${person.name}?`;
    setModalState({ isOpen: true, person, message });
  };

  const handleDeletePerson = async () => {
    const { person } = modalState;
    try {
      const personDoc = doc(db, "users", userId, "people", person.id);
      await deleteDoc(personDoc);

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
    } finally {
      setModalState({ isOpen: false, person: null, message: "" });
    }
  };

  const calculateTotalAmount = () => {
    return Object.values(peopleWithExpenses).reduce(
      (acc, expense) => acc + expense,
      0
    );
  };

  const totalAmount = calculateTotalAmount().toFixed(2);

  const calculateBalance = (userExpense) => {
    const contri = totalAmount / people.length;
    if (contri - userExpense > 0) {
      return `Pay £${(contri - userExpense).toFixed(2)}`;
    } else if (contri - userExpense < 0) {
      return `Receive £${(contri - userExpense).toFixed(2) * -1}`;
    } else {
      return "No dues left";
    }
  };

  const userContribution = () => (
    <div className="contribution-modal">
      <h4>Total Amount: £{totalAmount}</h4>
      <h5>
        Each Member Contribution: £{(totalAmount / people.length).toFixed(2)}
      </h5>
      <ul className="user-contri-list">
        <li className="list-headings">
          <p className="contri-user-name">Name</p>
          <p className="due">Pay / Receive</p>
        </li>
        {people.map((person) => (
          <li key={person.id}>
            <p className="contri-user-name">{toTitleCase(person.name)}</p>
            <p className="due">
              {calculateBalance(peopleWithExpenses[person.name])}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="my-users">
      <h2>My Users</h2>

      {/* Add Person Section */}
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

      {/* People List */}
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
                <span className="person-name">{toTitleCase(person.name)}</span>
                <span className="total-expenses">
                  {peopleWithExpenses[person.name]
                    ? `£${peopleWithExpenses[person.name].toFixed(2)}`
                    : "£0"}
                </span>
                <button
                  className="delete-button"
                  onClick={() => confirmDeletePerson(person)}
                >
                  <i className="fa fa-trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <hr />
        <button
          className="calculate-contribution"
          onClick={() =>
            setInfoModalState({
              isOpen: true,
              message: userContribution(),
            })
          }
        >
          Calculate Contribution
        </button>
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <Modal
          title="Confirm Deletion"
          message={modalState.message}
          onConfirm={handleDeletePerson}
          confirmText="Delete"
          onCancel={() =>
            setModalState({ isOpen: false, person: null, message: "" })
          }
          cancelBtn={true}
        />
      )}

      {/* Info Modal */}
      {infoModalState.isOpen && (
        <Modal
          title="Contribution dues"
          message={infoModalState.message}
          onConfirm={() => setInfoModalState({ isOpen: false })}
          onCancel={() => setInfoModalState({ isOpen: false })}
          cancelBtn={false}
          confirmText="Close"
        />
      )}
    </div>
  );
};

export default MyUsers;
