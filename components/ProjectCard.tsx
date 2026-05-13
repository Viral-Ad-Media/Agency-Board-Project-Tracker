import { Calendar } from "lucide-react";
import type { DragEvent } from "react";
import { PipelineTrack } from "./PipelineTrack";
import {
  AVATAR_COLORS,
  COLUMNS,
  countCompleteStages,
  formatDate,
  getInitials,
  isOverdue,
  priorityClass,
  type Project,
  type TeamMember,
} from "../lib/projects";

type ProjectCardProps = {
  project: Project;
  isDragging: boolean;
  onOpenDetail: (projectId: string) => void;
  onToggleStage: (projectId: string, stageIndex: number) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onDragEnd: () => void;
};

export function ProjectCard({
  project,
  isDragging,
  onOpenDetail,
  onToggleStage,
  onDragStart,
  onDragEnd,
}: ProjectCardProps) {
  const overdue = isOverdue(project);
  const doneCount = countCompleteStages(project);
  const avatarColor = AVATAR_COLORS[project.assignee as TeamMember] ?? "#5a5aff";

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
            <span className="assignee-avatar" style={{ background: avatarColor }}>
              {getInitials(project.assignee)}
            </span>
            <span>{project.assignee}</span>
          </span>
          <span className={`card-deadline${overdue ? " overdue-text" : ""}`}>
            <Calendar size={11} aria-hidden="true" />
            {formatDate(project.deadline)}
          </span>
        </span>

        {overdue ? (
          <span className="overdue-row">
            <span className="overdue-flag">OVERDUE</span>
          </span>
        ) : null}
      </button>

      <div className="pipeline-section">
        <div className="pipeline-summary">
          <strong>{doneCount}</strong> of {COLUMNS.length} stages complete
        </div>
        <PipelineTrack project={project} onToggleStage={onToggleStage} />
      </div>
    </div>
  );
}
