import { Calendar } from "lucide-react";
import { memo, type DragEvent } from "react";
import { PipelineTrack } from "./PipelineTrack";
import {
  countCompleteStages,
  countCompleteSubtasks,
  daysUntilDeadline,
  formatDate,
  getAvatarColor,
  getInitials,
  getMemberName,
  isDueSoon,
  isOverdue,
  priorityClass,
  type BoardColumnDef,
  type Task,
  type TeamMemberDef,
} from "../lib/tasks";

const MAX_AVATAR_STACK = 3;

function dueSoonLabel(daysLeft: number | null) {
  if (daysLeft === 0) return "DUE TODAY";
  if (daysLeft === 1) return "DUE TOMORROW";
  return `DUE IN ${daysLeft} DAYS`;
}

type TaskCardProps = {
  task: Task;
  columns: BoardColumnDef[];
  teamMembers: TeamMemberDef[];
  isDragging: boolean;
  onOpenDetail: (taskId: string) => void;
  onToggleStage: (taskId: string, columnId: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: () => void;
};

export const TaskCard = memo(function TaskCard({
  task,
  columns,
  teamMembers,
  isDragging,
  onOpenDetail,
  onToggleStage,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const overdue = isOverdue(task, columns);
  const dueSoon = !overdue && isDueSoon(task, columns);
  const doneCount = countCompleteStages(task, columns);
  const visibleAssignees = task.assignees.slice(0, MAX_AVATAR_STACK);
  const overflowCount = task.assignees.length - visibleAssignees.length;
  const primaryName = task.assignees[0]
    ? getMemberName(teamMembers, task.assignees[0])
    : "Unassigned";
  const assigneeSummary =
    task.assignees.length <= 1 ? primaryName : `${primaryName} +${task.assignees.length - 1}`;

  return (
    <div
      className={`card${overdue ? " overdue" : ""}${isDragging ? " dragging" : ""}`}
      data-id={task.id}
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
    >
      <button className="card-body" type="button" onClick={() => onOpenDetail(task.id)}>
        <span className="card-top">
          <span className="card-name">{task.name}</span>
          <span className={`priority-badge ${priorityClass(task.priority)}`}>
            {task.priority}
          </span>
        </span>

        <span className="card-client">
          Client: <span>{task.client}</span>
        </span>

        <span className="card-meta">
          <span className="card-assignee">
            <span className="assignee-avatar-stack">
              {visibleAssignees.map((memberId) => {
                const memberName = getMemberName(teamMembers, memberId);
                return (
                  <span
                    key={memberId}
                    className="assignee-avatar"
                    style={{ background: getAvatarColor(teamMembers, memberId) }}
                    title={memberName}
                  >
                    {getInitials(memberName)}
                  </span>
                );
              })}
              {overflowCount > 0 ? (
                <span className="assignee-avatar assignee-avatar-overflow">+{overflowCount}</span>
              ) : null}
            </span>
            <span>{assigneeSummary}</span>
          </span>
          <span
            className={`card-deadline${overdue ? " overdue-text" : ""}${dueSoon ? " due-soon-text" : ""}`}
          >
            <Calendar size={11} aria-hidden="true" />
            {formatDate(task.deadline)}
          </span>
        </span>

        {overdue ? (
          <span className="overdue-row">
            <span className="overdue-flag">OVERDUE</span>
          </span>
        ) : dueSoon ? (
          <span className="overdue-row">
            <span className="due-soon-flag">{dueSoonLabel(daysUntilDeadline(task))}</span>
          </span>
        ) : null}
      </button>

      <div className="pipeline-section">
        <div className="pipeline-summary">
          <strong>{doneCount}</strong> of {columns.length} stages complete
          {task.subtasks.length > 0 ? (
            <>
              {" "}
              &middot; <strong>{countCompleteSubtasks(task)}</strong> of {task.subtasks.length}{" "}
              subtasks
            </>
          ) : null}
        </div>
        <PipelineTrack task={task} columns={columns} onToggleStage={onToggleStage} />
      </div>
    </div>
  );
});
