import type { DragEvent } from "react";
import { BoardColumn } from "./BoardColumn";
import { COLUMNS, type Column, type Project } from "../lib/projects";

type ProjectBoardProps = {
  projects: Project[];
  draggingId: string | null;
  dragOverColumn: Column | null;
  onOpenProject: (projectId: string) => void;
  onToggleStage: (projectId: string, stageIndex: number) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, column: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, column: Column) => void;
};

export function ProjectBoard({
  projects,
  draggingId,
  dragOverColumn,
  onOpenProject,
  onToggleStage,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}: ProjectBoardProps) {
  return (
    <section className="board-wrapper" aria-label="Project board">
      <div className="board">
        {COLUMNS.map((column) => (
          <BoardColumn
            key={column}
            column={column}
            projects={projects.filter((project) => project.column === column)}
            draggingId={draggingId}
            isDragOver={dragOverColumn === column}
            onOpenProject={onOpenProject}
            onToggleStage={onToggleStage}
            onCardDragStart={onCardDragStart}
            onCardDragEnd={onCardDragEnd}
            onColumnDragOver={onColumnDragOver}
            onColumnDragLeave={onColumnDragLeave}
            onColumnDrop={onColumnDrop}
          />
        ))}
      </div>
    </section>
  );
}
