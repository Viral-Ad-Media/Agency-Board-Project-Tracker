import { Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import type { Task } from "../lib/tasks";

type ConfirmDeleteModalProps = {
  task: Task | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({ task, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={Boolean(task)} onClose={onCancel}>
      {task ? (
        <div className="modal confirm-modal">
          <div className="modal-header confirm-header">
            <div className="confirm-icon" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <h2 className="modal-title confirm-title">Delete Task?</h2>
            <p className="confirm-message">
              &quot;{task.name}&quot; will be removed from the board. You&apos;ll have a few
              seconds to undo.
            </p>
          </div>
          <div className="form-actions confirm-actions">
            <button className="btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-danger" type="button" onClick={onConfirm}>
              Yes, Delete
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
