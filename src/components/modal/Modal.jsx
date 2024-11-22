import React from "react";
import "./modal.css";

const Modal = ({ title, message, onConfirm, onCancel }) => {
  const [cancelVis, setCancelVis] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button className="modal-btn confirm" onClick={onConfirm}>
            Confirm
          </button>
          <button className="modal-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
