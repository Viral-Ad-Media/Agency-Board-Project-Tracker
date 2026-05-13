import { X } from "lucide-react";
import { DetailItem } from "./DetailItem";
import { Modal } from "./Modal";
import { PipelineTrack } from "./PipelineTrack";
import {
  formatDate,
  isOverdue,
  priorityClass,
  type Project,
} from "../lib/projects";

type ProjectDetailModalProps = {
  project: Project | null;
  onClose: () => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleStage: (projectId: string, stageIndex: number) => void;
};

export function ProjectDetailModal({
  project,
  onClose,
  onEdit,
  onDelete,
  onToggleStage,
}: ProjectDetailModalProps) {
  return (
    <Modal isOpen={Boolean(project)} onClose={onClose}>
      {project ? (
        <div className="modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{project.name}</h2>
              <div className="detail-pill-row">
                <span className={`priority-badge ${priorityClass(project.priority)}`}>
                  {project.priority}
                </span>
                <span className="col-badge">{project.column}</span>
              </div>
            </div>
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="detail-meta-grid">
            <DetailItem label="Client" value={project.client} />
            <DetailItem label="Assigned To" value={project.assignee} />
            <DetailItem label="Deadline" value={formatDate(project.deadline)} />
            <div className="detail-section">
              <div className="detail-section-label">Status</div>
              <div className="detail-section-value">
                {isOverdue(project) ? (
                  <span className="status-text danger">Overdue</span>
                ) : project.column === "Done" || project.column === "Live" ? (
                  <span className="status-text success">{project.column}</span>
                ) : (
                  "On Track"
                )}
              </div>
            </div>
          </div>

          <DetailItem label="Description" value={project.desc || "No description provided."} />

          <div className="detail-pipeline-section">
            <div className="detail-pipeline-title">Project Stages</div>
            <PipelineTrack project={project} isDetail onToggleStage={onToggleStage} />
          </div>

          <div className="detail-actions">
            <button className="btn-danger" type="button" onClick={() => onDelete(project.id)}>
              Delete
            </button>
            <div className="detail-actions-spacer" />
            <button className="btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
            <button className="btn-primary" type="button" onClick={() => onEdit(project.id)}>
              Edit Project
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
