import { X } from "lucide-react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";
import {
  PRIORITIES,
  type InvalidField,
  type TaskFormState,
  type TeamMember,
  type TeamMemberDef,
} from "../lib/tasks";

type TextField = "name" | "client" | "desc" | "deadline" | "priority";

type TaskFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  formData: TaskFormState;
  invalidFields: Set<InvalidField>;
  teamMembers: TeamMemberDef[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: TextField, value: string) => void;
  onToggleAssignee: (member: TeamMember) => void;
};

export function TaskFormModal({
  isOpen,
  isEditing,
  formData,
  invalidFields,
  teamMembers,
  onClose,
  onSubmit,
  onFieldChange,
  onToggleAssignee,
}: TaskFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? "Edit Task" : "Initiate Task"}</h2>
            <p className="modal-subtitle">
              {isEditing
                ? "Update the task details below."
                : "Fill in the details to create a new task card."}
            </p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <label className="form-field">
            <span className="form-label">Task Name</span>
            <input
              className={`form-input${invalidFields.has("name") ? " invalid" : ""}`}
              type="text"
              placeholder="e.g. Brand Refresh Campaign"
              value={formData.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Client Name</span>
            <input
              className={`form-input${invalidFields.has("client") ? " invalid" : ""}`}
              type="text"
              placeholder="e.g. Acme Corp"
              value={formData.client}
              onChange={(event) => onFieldChange("client", event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Description</span>
            <textarea
              className="form-textarea"
              placeholder="Brief task description..."
              value={formData.desc}
              onChange={(event) => onFieldChange("desc", event.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Deadline</span>
              <input
                className={`form-input${invalidFields.has("deadline") ? " invalid" : ""}`}
                type="date"
                value={formData.deadline}
                onChange={(event) => onFieldChange("deadline", event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Priority</span>
              <select
                className={`form-select${invalidFields.has("priority") ? " invalid" : ""}`}
                value={formData.priority}
                onChange={(event) => onFieldChange("priority", event.target.value)}
                required
              >
                <option value="">Select...</option>
                {PRIORITIES.map((priority) => (
                  <option value={priority} key={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-field">
            <span className="form-label">Assigned To</span>
            <div
              className={`assignee-checkbox-grid${invalidFields.has("assignees") ? " invalid" : ""}`}
            >
              {teamMembers.map((member) => (
                <label className="assignee-checkbox" key={member.id}>
                  <input
                    type="checkbox"
                    checked={formData.assignees.includes(member.id)}
                    onChange={() => onToggleAssignee(member.id)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
