import type { DragEvent } from "react";
import { ProjectCard } from "./ProjectCard";
import type { Column, Project } from "../lib/projects";

type BoardColumnProps = {
  column: Column;
  projects: Project[];
  draggingId: string | null;
  isDragOver: boolean;
  onOpenProject: (projectId: string) => void;
  onToggleStage: (projectId: string, stageIndex: number) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, column: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, column: Column) => void;
};

export function BoardColumn({
  column,
  projects,
  draggingId,
  isDragOver,
  onOpenProject,
  onToggleStage,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}: BoardColumnProps) {
  return (
    <article className="column" data-col={column}>
      <div className="column-header">
        <h2 className="column-title">{column}</h2>
        <span className="column-count">{projects.length}</span>
      </div>

      <div
        className={`column-cards${isDragOver ? " drag-over" : ""}`}
        data-col={column}
        onDragOver={(event) => onColumnDragOver(event, column)}
        onDragLeave={onColumnDragLeave}
        onDrop={(event) => onColumnDrop(event, column)}
      >
        {projects.length === 0 ? (
          <div className="column-empty">Drop cards here</div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isDragging={draggingId === project.id}
              onOpenDetail={onOpenProject}
              onToggleStage={onToggleStage}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
            />
          ))
        )}
      </div>
    </article>
  );
}
