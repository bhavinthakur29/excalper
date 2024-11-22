import React from "react";
import "./modal.css";

const Modal = ({
  title,
  message,
  onConfirm,
  onCancel,
  cancelBtn,
  confirmText,
}) => {
  const cancelVis = true;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">{title}</h3>
        <div className="modal-message">{message}</div>
        <div className="modal-buttons">
          <button className="modal-btn confirm" onClick={onConfirm}>
            {confirmText || "Confirm"}
          </button>
          {cancelVis == cancelBtn && (
            <button className="modal-btn cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
