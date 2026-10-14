import { X } from "lucide-react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";
import { PROJECT_STATUSES, projectStatusLabel, type ProjectStatus } from "../lib/tasks";

export type ProjectFormState = {
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
};

type ProjectFormField = keyof ProjectFormState;

type ProjectFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  formData: ProjectFormState;
  isInvalid: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: ProjectFormField, value: string) => void;
};

export function ProjectFormModal({
  isOpen,
  isEditing,
  formData,
  isInvalid,
  onClose,
  onSubmit,
  onFieldChange,
}: ProjectFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? "Edit Project" : "New Project"}</h2>
            <p className="modal-subtitle">
              {isEditing
                ? "Update the project details below."
                : "Set up a new project to group tasks under."}
            </p>
          </div>
          <Tooltip label="Close">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <label className="form-field">
            <span className="form-label">Project Name</span>
            <input
              className={`form-input${isInvalid && !formData.name.trim() ? " invalid" : ""}`}
              type="text"
              placeholder="e.g. Website Relaunch"
              value={formData.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Client Name</span>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Acme Corp"
              value={formData.client}
              onChange={(event) => onFieldChange("client", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Description</span>
            <textarea
              className="form-textarea"
              placeholder="Brief project description..."
              value={formData.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Start Date</span>
              <input
                className="form-input"
                type="date"
                value={formData.startDate}
                onChange={(event) => onFieldChange("startDate", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Target Date</span>
              <input
                className="form-input"
                type="date"
                value={formData.targetDate}
                onChange={(event) => onFieldChange("targetDate", event.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span className="form-label">Status</span>
            <select
              className="form-select"
              value={formData.status}
              onChange={(event) => onFieldChange("status", event.target.value)}
            >
              {PROJECT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {projectStatusLabel(status)}
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
