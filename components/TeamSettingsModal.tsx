import { Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import type { TeamMemberDef } from "../lib/tasks";

type TeamSettingsModalProps = {
  isOpen: boolean;
  teamMembers: TeamMemberDef[];
  memberCounts: Record<string, number>;
  onClose: () => void;
  onDelete: (memberId: string) => void;
  onAdd: (name: string) => void;
};

export function TeamSettingsModal({
  isOpen,
  teamMembers,
  memberCounts,
  onClose,
  onDelete,
  onAdd,
}: TeamSettingsModalProps) {
  const [newMemberName, setNewMemberName] = useState("");

  function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    onAdd(trimmed);
    setNewMemberName("");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Team Members</h2>
            <p className="modal-subtitle">
              Add or remove people who can be assigned to tasks and subtasks. Members with
              assignments can&apos;t be removed.
            </p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <ul className="settings-list">
          {teamMembers.map((member) => {
            const count = memberCounts[member.id] ?? 0;

            return (
              <li className="settings-row" key={member.id}>
                <span className="settings-name settings-name-static">{member.name}</span>
                <span className="settings-count">{count}</span>
                <button
                  className="icon-btn icon-btn-danger"
                  type="button"
                  disabled={count > 0 || teamMembers.length <= 1}
                  onClick={() => onDelete(member.id)}
                  aria-label={`Remove ${member.name}`}
                  title={
                    count > 0
                      ? "Unassign them from tasks and subtasks first"
                      : teamMembers.length <= 1
                        ? "The team needs at least one member"
                        : `Remove ${member.name}`
                  }
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>

        <form className="settings-add" onSubmit={handleAddSubmit}>
          <input
            className="form-input"
            type="text"
            placeholder="New team member name..."
            value={newMemberName}
            onChange={(event) => setNewMemberName(event.target.value)}
          />
          <button className="btn-secondary settings-add-btn" type="submit">
            <Plus size={14} />
            Add Member
          </button>
        </form>

        <div className="form-actions">
          <button className="btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
