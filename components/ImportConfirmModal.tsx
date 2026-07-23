import { Upload } from "lucide-react";
import { Modal } from "./Modal";

type ImportConfirmModalProps = {
  fileName: string | null;
  importCount: number;
  currentCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ImportConfirmModal({
  fileName,
  importCount,
  currentCount,
  onCancel,
  onConfirm,
}: ImportConfirmModalProps) {
  return (
    <Modal isOpen={Boolean(fileName)} onClose={onCancel}>
      {fileName ? (
        <div className="modal confirm-modal">
          <div className="modal-header confirm-header">
            <div className="confirm-icon import-icon" aria-hidden="true">
              <Upload size={24} />
            </div>
            <h2 className="modal-title confirm-title">Import Backup?</h2>
            <p className="confirm-message">
              This will replace the current board ({currentCount}{" "}
              {currentCount === 1 ? "task" : "tasks"}) with {importCount}{" "}
              {importCount === 1 ? "task" : "tasks"} from &quot;{fileName}&quot;.
            </p>
          </div>
          <div className="form-actions confirm-actions">
            <button className="btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={onConfirm}>
              Replace Board
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
