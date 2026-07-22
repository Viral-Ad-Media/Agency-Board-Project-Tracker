import { X } from "lucide-react";
import { DetailItem } from "./DetailItem";
import { Modal } from "./Modal";
import { PipelineTrack } from "./PipelineTrack";
import { TaskChecklist } from "./TaskChecklist";
import {
  AVATAR_COLORS,
  findColumn,
  formatDate,
  getInitials,
  isColumnComplete,
  isDueSoon,
  isOverdue,
  priorityClass,
  type BoardColumnDef,
  type Column,
  type Project,
  type TeamMember,
} from "../lib/projects";

type ProjectDetailModalProps = {
  project: Project | null;
  columns: BoardColumnDef[];
  onClose: () => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleStage: (projectId: string, columnId: string) => void;
  onMoveColumn: (projectId: string, column: Column) => void;
  onAddTask: (projectId: string, title: string) => void;
  onToggleTask: (projectId: string, taskId: string) => void;
  onAssignTask: (projectId: string, taskId: string, assignee: "" | TeamMember) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
};

export function ProjectDetailModal({
  project,
  columns,
  onClose,
  onEdit,
  onDelete,
  onToggleStage,
  onMoveColumn,
  onAddTask,
  onToggleTask,
  onAssignTask,
  onDeleteTask,
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
                <label className="col-badge-select-wrap">
                  <span className="sr-only">Move to column</span>
                  <select
                    className="col-badge-select"
                    value={project.column}
                    onChange={(event) => onMoveColumn(project.id, event.target.value)}
                  >
                    {columns.map((column) => (
                      <option value={column.id} key={column.id}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="detail-meta-grid">
            <div className="detail-section">
              <div className="detail-section-label">Assigned To</div>
              <div className="detail-assignee-chips">
                {project.assignees.map((member) => (
                  <span className="detail-assignee-chip" key={member}>
                    <span
                      className="assignee-avatar"
                      style={{ background: AVATAR_COLORS[member] ?? "#5a5aff" }}
                    >
                      {getInitials(member)}
                    </span>
                    {member}
                  </span>
                ))}
              </div>
            </div>
            <DetailItem label="Client" value={project.client} />
            <DetailItem label="Deadline" value={formatDate(project.deadline)} />
            <div className="detail-section">
              <div className="detail-section-label">Status</div>
              <div className="detail-section-value">
                {isOverdue(project, columns) ? (
                  <span className="status-text danger">Overdue</span>
                ) : isColumnComplete(columns, project.column) ? (
                  <span className="status-text success">
                    {findColumn(columns, project.column)?.name ?? "Complete"}
                  </span>
                ) : isDueSoon(project, columns) ? (
                  <span className="status-text warning">Due Soon</span>
                ) : (
                  "On Track"
                )}
              </div>
            </div>
          </div>

          <DetailItem label="Description" value={project.desc || "No description provided."} />

          <div className="detail-pipeline-section">
            <div className="detail-pipeline-title">Project Stages</div>
            <PipelineTrack project={project} columns={columns} isDetail onToggleStage={onToggleStage} />
          </div>

          <div className="detail-pipeline-section">
            <div className="detail-pipeline-title">Tasks</div>
            <TaskChecklist
              tasks={project.tasks}
              onAdd={(title) => onAddTask(project.id, title)}
              onToggle={(taskId) => onToggleTask(project.id, taskId)}
              onAssign={(taskId, assignee) => onAssignTask(project.id, taskId, assignee)}
              onDelete={(taskId) => onDeleteTask(project.id, taskId)}
            />
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
