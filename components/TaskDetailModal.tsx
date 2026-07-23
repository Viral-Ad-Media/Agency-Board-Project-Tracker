import { X } from "lucide-react";
import { DetailItem } from "./DetailItem";
import { Modal } from "./Modal";
import { PipelineTrack } from "./PipelineTrack";
import { SubtaskChecklist } from "./SubtaskChecklist";
import {
  findColumn,
  formatDate,
  getAvatarColor,
  getInitials,
  getMemberName,
  isColumnComplete,
  isDueSoon,
  isOverdue,
  priorityClass,
  type BoardColumnDef,
  type Column,
  type Task,
  type TeamMember,
  type TeamMemberDef,
} from "../lib/tasks";

type TaskDetailModalProps = {
  task: Task | null;
  columns: BoardColumnDef[];
  teamMembers: TeamMemberDef[];
  onClose: () => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onToggleStage: (taskId: string, columnId: string) => void;
  onMoveColumn: (taskId: string, column: Column) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAssignSubtask: (taskId: string, subtaskId: string, assignee: "" | TeamMember) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
};

export function TaskDetailModal({
  task,
  columns,
  teamMembers,
  onClose,
  onEdit,
  onDelete,
  onToggleStage,
  onMoveColumn,
  onAddSubtask,
  onToggleSubtask,
  onAssignSubtask,
  onDeleteSubtask,
}: TaskDetailModalProps) {
  return (
    <Modal isOpen={Boolean(task)} onClose={onClose}>
      {task ? (
        <div className="modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{task.name}</h2>
              <div className="detail-pill-row">
                <span className={`priority-badge ${priorityClass(task.priority)}`}>
                  {task.priority}
                </span>
                <label className="col-badge-select-wrap">
                  <span className="sr-only">Move to column</span>
                  <select
                    className="col-badge-select"
                    value={task.column}
                    onChange={(event) => onMoveColumn(task.id, event.target.value)}
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
                {task.assignees.map((memberId) => {
                  const memberName = getMemberName(teamMembers, memberId);
                  return (
                    <span className="detail-assignee-chip" key={memberId}>
                      <span
                        className="assignee-avatar"
                        style={{ background: getAvatarColor(teamMembers, memberId) }}
                      >
                        {getInitials(memberName)}
                      </span>
                      {memberName}
                    </span>
                  );
                })}
              </div>
            </div>
            <DetailItem label="Client" value={task.client} />
            <DetailItem label="Deadline" value={formatDate(task.deadline)} />
            <div className="detail-section">
              <div className="detail-section-label">Status</div>
              <div className="detail-section-value">
                {isOverdue(task, columns) ? (
                  <span className="status-text danger">Overdue</span>
                ) : isColumnComplete(columns, task.column) ? (
                  <span className="status-text success">
                    {findColumn(columns, task.column)?.name ?? "Complete"}
                  </span>
                ) : isDueSoon(task, columns) ? (
                  <span className="status-text warning">Due Soon</span>
                ) : (
                  "On Track"
                )}
              </div>
            </div>
          </div>

          <DetailItem label="Description" value={task.desc || "No description provided."} />

          <div className="detail-pipeline-section">
            <div className="detail-pipeline-title">Task Stages</div>
            <PipelineTrack task={task} columns={columns} isDetail onToggleStage={onToggleStage} />
          </div>

          <div className="detail-pipeline-section">
            <div className="detail-pipeline-title">Subtasks</div>
            <SubtaskChecklist
              subtasks={task.subtasks}
              teamMembers={teamMembers}
              onAdd={(title) => onAddSubtask(task.id, title)}
              onToggle={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
              onAssign={(subtaskId, assignee) => onAssignSubtask(task.id, subtaskId, assignee)}
              onDelete={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
            />
          </div>

          <div className="detail-actions">
            <button className="btn-danger" type="button" onClick={() => onDelete(task.id)}>
              Delete
            </button>
            <div className="detail-actions-spacer" />
            <button className="btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
            <button className="btn-primary" type="button" onClick={() => onEdit(task.id)}>
              Edit Task
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
