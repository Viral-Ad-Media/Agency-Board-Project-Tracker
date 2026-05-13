import { Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import type { Project } from "../lib/projects";

type ConfirmDeleteModalProps = {
  project: Project | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  project,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={Boolean(project)} onClose={onCancel}>
      {project ? (
        <div className="modal confirm-modal">
          <div className="modal-header confirm-header">
            <div className="confirm-icon" aria-hidden="true">
              <Trash2 size={24} />
            </div>
            <h2 className="modal-title confirm-title">Delete Project?</h2>
            <p className="confirm-message">
              &quot;{project.name}&quot; will be permanently removed. This cannot be undone.
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
