import { Trash2 } from "lucide-react";
import { Modal } from "./Modal";

type ConfirmActionModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = "Yes, Delete",
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      {isOpen ? (
        <div className="modal confirm-modal">
          <div className="modal-header confirm-header">
            <div className="confirm-icon" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <h2 className="modal-title confirm-title">{title}</h2>
            <p className="confirm-message">{message}</p>
          </div>
          <div className="form-actions confirm-actions">
            <button className="btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-danger" type="button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
