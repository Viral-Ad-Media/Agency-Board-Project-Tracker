import type { CSSProperties, DragEvent } from "react";
import { ProjectCard } from "./ProjectCard";
import type { BoardColumnDef, Column, Project } from "../lib/projects";

type BoardColumnProps = {
  column: BoardColumnDef;
  columns: BoardColumnDef[];
  accentColor: string;
  projects: Project[];
  draggingId: string | null;
  isDragOver: boolean;
  onOpenProject: (projectId: string) => void;
  onToggleStage: (projectId: string, columnId: string) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
};

export function BoardColumn({
  column,
  columns,
  accentColor,
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
    <article
      className="column"
      data-col={column.id}
      style={{ "--col-accent": accentColor } as CSSProperties}
    >
      <div className="column-header">
        <h2 className="column-title">{column.name}</h2>
        <span className="column-count">{projects.length}</span>
      </div>

      <div
        className={`column-cards${isDragOver ? " drag-over" : ""}`}
        data-col={column.id}
        onDragOver={(event) => onColumnDragOver(event, column.id)}
        onDragLeave={onColumnDragLeave}
        onDrop={(event) => onColumnDrop(event, column.id)}
      >
        {projects.length === 0 ? (
          <div className="column-empty">Drop cards here</div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              columns={columns}
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
