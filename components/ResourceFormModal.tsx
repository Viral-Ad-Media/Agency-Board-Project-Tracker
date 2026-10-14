import { X } from "lucide-react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";
import {
  BILLING_CYCLES,
  RESOURCE_CATEGORIES,
  RESOURCE_STATUSES,
  billingCycleLabel,
  resourceCategoryLabel,
  resourceStatusLabel,
  type BillingCycle,
  type ResourceCategory,
  type ResourceStatus,
  type TeamMemberDef,
} from "../lib/tasks";

export type ResourceFormState = {
  name: string;
  category: ResourceCategory;
  cost: string;
  billingCycle: BillingCycle;
  status: ResourceStatus;
  renewalDate: string;
  url: string;
  notes: string;
  ownerId: string;
};

type ResourceFormField = keyof ResourceFormState;

type ResourceFormModalProps = {
  isOpen: boolean;
  isEditing: boolean;
  formData: ResourceFormState;
  isInvalid: boolean;
  teamMembers: TeamMemberDef[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: ResourceFormField, value: string) => void;
};

export function ResourceFormModal({
  isOpen,
  isEditing,
  formData,
  isInvalid,
  teamMembers,
  onClose,
  onSubmit,
  onFieldChange,
}: ResourceFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? "Edit Subscription" : "Add Subscription"}</h2>
            <p className="modal-subtitle">
              Track a tool, app, or service the agency pays for and its cost.
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
            <span className="form-label">Name</span>
            <input
              className={`form-input${isInvalid && !formData.name.trim() ? " invalid" : ""}`}
              type="text"
              placeholder="e.g. Figma"
              value={formData.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              required
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Category</span>
              <select
                className="form-select"
                value={formData.category}
                onChange={(event) => onFieldChange("category", event.target.value)}
              >
                {RESOURCE_CATEGORIES.map((category) => (
                  <option value={category} key={category}>
                    {resourceCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-label">Status</span>
              <select
                className="form-select"
                value={formData.status}
                onChange={(event) => onFieldChange("status", event.target.value)}
              >
                {RESOURCE_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {resourceStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Cost</span>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.cost}
                onChange={(event) => onFieldChange("cost", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Billing Cycle</span>
              <select
                className="form-select"
                value={formData.billingCycle}
                onChange={(event) => onFieldChange("billingCycle", event.target.value)}
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option value={cycle} key={cycle}>
                    {billingCycleLabel(cycle)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Next Renewal</span>
              <input
                className="form-input"
                type="date"
                value={formData.renewalDate}
                onChange={(event) => onFieldChange("renewalDate", event.target.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Owner</span>
              <select
                className="form-select"
                value={formData.ownerId}
                onChange={(event) => onFieldChange("ownerId", event.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span className="form-label">Link</span>
            <input
              className="form-input"
              type="text"
              placeholder="https://..."
              value={formData.url}
              onChange={(event) => onFieldChange("url", event.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Notes</span>
            <textarea
              className="form-textarea"
              placeholder="Login details, plan tier, who requested it..."
              value={formData.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
            />
          </label>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
