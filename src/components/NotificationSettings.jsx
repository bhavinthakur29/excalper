import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function NotificationSettings({ userId }) {
  const [notificationDate, setNotificationDate] = useState("");

  const handleSetDate = async () => {
    try {
      await setDoc(doc(db, "users", userId), { notificationDate });
      toast.success("Notification date set");
    } catch (error) {
      toast.error("Failed to set notification date");
    }
  };

  return (
    <div>
      <input
        type="date"
        onChange={(e) => setNotificationDate(e.target.value)}
      />
      <button onClick={handleSetDate}>Set Notification Date</button>
    </div>
  );
}
