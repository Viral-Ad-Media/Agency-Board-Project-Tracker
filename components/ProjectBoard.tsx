import type { DragEvent } from "react";
import { BoardColumn } from "./BoardColumn";
import type { BoardColumnDef, Column, Project } from "../lib/projects";

const COLUMN_ACCENT_PALETTE = ["#5a5aff", "#b05aff", "#ffaa00", "#ff6b2b", "#00cc88", "#00e5ff"];

type ProjectBoardProps = {
  columns: BoardColumnDef[];
  projects: Project[];
  draggingId: string | null;
  dragOverColumn: Column | null;
  onOpenProject: (projectId: string) => void;
  onToggleStage: (projectId: string, columnId: string) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
};

export function ProjectBoard({
  columns,
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
        {columns.map((column, index) => (
          <BoardColumn
            key={column.id}
            column={column}
            columns={columns}
            accentColor={COLUMN_ACCENT_PALETTE[index % COLUMN_ACCENT_PALETTE.length]}
            projects={projects.filter((project) => project.column === column.id)}
            draggingId={draggingId}
            isDragOver={dragOverColumn === column.id}
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
