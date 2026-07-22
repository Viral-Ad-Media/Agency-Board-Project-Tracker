import { Calendar } from "lucide-react";
import { memo, type DragEvent } from "react";
import { PipelineTrack } from "./PipelineTrack";
import {
  AVATAR_COLORS,
  countCompleteStages,
  countCompleteTasks,
  daysUntilDeadline,
  formatDate,
  getInitials,
  isDueSoon,
  isOverdue,
  priorityClass,
  type BoardColumnDef,
  type Project,
} from "../lib/projects";

const MAX_AVATAR_STACK = 3;

function dueSoonLabel(daysLeft: number | null) {
  if (daysLeft === 0) return "DUE TODAY";
  if (daysLeft === 1) return "DUE TOMORROW";
  return `DUE IN ${daysLeft} DAYS`;
}

type ProjectCardProps = {
  project: Project;
  columns: BoardColumnDef[];
  isDragging: boolean;
  onOpenDetail: (projectId: string) => void;
  onToggleStage: (projectId: string, columnId: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onDragEnd: () => void;
};

export const ProjectCard = memo(function ProjectCard({
  project,
  columns,
  isDragging,
  onOpenDetail,
  onToggleStage,
  onDragStart,
  onDragEnd,
}: ProjectCardProps) {
  const overdue = isOverdue(project, columns);
  const dueSoon = !overdue && isDueSoon(project, columns);
  const doneCount = countCompleteStages(project, columns);
  const visibleAssignees = project.assignees.slice(0, MAX_AVATAR_STACK);
  const overflowCount = project.assignees.length - visibleAssignees.length;
  const assigneeSummary =
    project.assignees.length <= 1
      ? (project.assignees[0] ?? "Unassigned")
      : `${project.assignees[0]} +${project.assignees.length - 1}`;

  return (
    <div
      className={`card${overdue ? " overdue" : ""}${isDragging ? " dragging" : ""}`}
      data-id={project.id}
      draggable
      onDragStart={(event) => onDragStart(event, project.id)}
      onDragEnd={onDragEnd}
    >
      <button className="card-body" type="button" onClick={() => onOpenDetail(project.id)}>
        <span className="card-top">
          <span className="card-name">{project.name}</span>
          <span className={`priority-badge ${priorityClass(project.priority)}`}>
            {project.priority}
          </span>
        </span>

        <span className="card-client">
          Client: <span>{project.client}</span>
        </span>

        <span className="card-meta">
          <span className="card-assignee">
            <span className="assignee-avatar-stack">
              {visibleAssignees.map((member) => (
                <span
                  key={member}
                  className="assignee-avatar"
                  style={{ background: AVATAR_COLORS[member] ?? "#5a5aff" }}
                  title={member}
                >
                  {getInitials(member)}
                </span>
              ))}
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
            {formatDate(project.deadline)}
          </span>
        </span>

        {overdue ? (
          <span className="overdue-row">
            <span className="overdue-flag">OVERDUE</span>
          </span>
        ) : dueSoon ? (
          <span className="overdue-row">
            <span className="due-soon-flag">{dueSoonLabel(daysUntilDeadline(project))}</span>
          </span>
        ) : null}
      </button>

      <div className="pipeline-section">
        <div className="pipeline-summary">
          <strong>{doneCount}</strong> of {columns.length} stages complete
          {project.tasks.length > 0 ? (
            <>
              {" "}
              &middot; <strong>{countCompleteTasks(project)}</strong> of {project.tasks.length}{" "}
              tasks
            </>
          ) : null}
        </div>
        <PipelineTrack project={project} columns={columns} onToggleStage={onToggleStage} />
      </div>
    </div>
  );
});
