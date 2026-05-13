import { X } from "lucide-react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";
import {
  PRIORITIES,
  TEAM_MEMBERS,
  type InvalidField,
  type ProjectFormState,
} from "../lib/projects";

type ProjectFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  formData: ProjectFormState;
  invalidFields: Set<InvalidField>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof ProjectFormState, value: string) => void;
};

export function ProjectFormModal({
  isOpen,
  isEditing,
  formData,
  invalidFields,
  onClose,
  onSubmit,
  onFieldChange,
}: ProjectFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? "Edit Project" : "Initiate Project"}</h2>
            <p className="modal-subtitle">
              {isEditing
                ? "Update the project details below."
                : "Fill in the details to create a new project card."}
            </p>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <label className="form-field">
            <span className="form-label">Project Name</span>
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
              placeholder="Brief project description..."
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

          <label className="form-field">
            <span className="form-label">Assigned To</span>
            <select
              className={`form-select${invalidFields.has("assignee") ? " invalid" : ""}`}
              value={formData.assignee}
              onChange={(event) => onFieldChange("assignee", event.target.value)}
              required
            >
              <option value="">Select team member...</option>
              {TEAM_MEMBERS.map((member) => (
                <option value={member} key={member}>
                  {member}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
