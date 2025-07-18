import React from 'react';
import './Modal.css';

export default function Modal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showCancel = true,
    customContent,
    isConfirming = false,
    isConfirmDisabled = false
}) {
    if (!isOpen) return null;

    const handleOverlayClick = () => {
        if (!isConfirming) {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    {customContent ? customContent : <p>{message}</p>}
                </div>
                <div className="modal-footer">
                    {showCancel && (
                        <button
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={isConfirming}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={isConfirming || isConfirmDisabled}
                    >
                        {isConfirming ? (
                            <>
                                <div className="modal-spinner"></div>
                                {confirmText}
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 