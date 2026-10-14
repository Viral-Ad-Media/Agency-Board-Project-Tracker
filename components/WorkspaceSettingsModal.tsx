import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";

type WorkspaceSettingsModalProps = {
  isOpen: boolean;
  name: string;
  isOwner: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function WorkspaceSettingsModal({
  isOpen,
  name,
  isOwner,
  onClose,
  onSave,
}: WorkspaceSettingsModalProps) {
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    if (isOpen) setDraftName(name);
  }, [isOpen, name]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner) return;

    const trimmed = draftName.trim();
    if (!trimmed) return;

    onSave(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Workspace Settings</h2>
            <p className="modal-subtitle">
              {isOwner
                ? "Rename your workspace."
                : "Only the workspace owner can rename this workspace."}
            </p>
          </div>
          <Tooltip label="Close">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">Workspace Name</span>
            <input
              className="form-input"
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              disabled={!isOwner}
              required
            />
          </label>

          <div className="form-actions">
            <button className="btn-secondary" type="button" onClick={onClose}>
              {isOwner ? "Cancel" : "Close"}
            </button>
            {isOwner ? (
              <button className="btn-primary" type="submit">
                Save
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </Modal>
  );
}
