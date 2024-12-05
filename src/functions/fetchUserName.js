import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../utils/firebase";

export const fetchUserName = async (setUserName, setUserDocId) => {
  try {
    if (auth.currentUser) {
      const userRef = collection(db, "users");
      const q = query(userRef, where("uid", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUserName(userDoc.data().name || "No Name Available");
        setUserDocId(userDoc.id); // Store document ID for updates
      } else {
        setUserName("Name not found");
      }
    }
  } catch (error) {
    toast.error("Failed to fetch user details.");
    console.error(error);
  }
};
