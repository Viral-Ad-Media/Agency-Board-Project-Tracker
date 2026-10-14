import type { DragEvent } from "react";
import { BoardColumn } from "./BoardColumn";
import type { BoardColumnDef, Column, Project, Task, TeamMemberDef } from "../lib/tasks";

const COLUMN_ACCENT_PALETTE = ["#5a5aff", "#b05aff", "#ffaa00", "#ff6b2b", "#00cc88", "#00e5ff"];

type TaskBoardProps = {
  columns: BoardColumnDef[];
  teamMembers: TeamMemberDef[];
  projects: Project[];
  tasks: Task[];
  isFiltering: boolean;
  draggingId: string | null;
  dragOverColumn: Column | null;
  onOpenTask: (taskId: string) => void;
  onToggleStage: (taskId: string, columnId: string) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
};

export function TaskBoard({
  columns,
  teamMembers,
  projects,
  tasks,
  isFiltering,
  draggingId,
  dragOverColumn,
  onOpenTask,
  onToggleStage,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}: TaskBoardProps) {
  return (
    <section className="board-wrapper" aria-label="Task board" data-tour-id="board">
      <div className="board">
        {columns.map((column, index) => (
          <BoardColumn
            key={column.id}
            column={column}
            columns={columns}
            teamMembers={teamMembers}
            projects={projects}
            accentColor={COLUMN_ACCENT_PALETTE[index % COLUMN_ACCENT_PALETTE.length]}
            tasks={tasks.filter((task) => task.column === column.id)}
            isFiltering={isFiltering}
            draggingId={draggingId}
            isDragOver={dragOverColumn === column.id}
            onOpenTask={onOpenTask}
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
