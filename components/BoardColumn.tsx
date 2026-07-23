import type { CSSProperties, DragEvent } from "react";
import { TaskCard } from "./TaskCard";
import type { BoardColumnDef, Column, Task, TeamMemberDef } from "../lib/tasks";

type BoardColumnProps = {
  column: BoardColumnDef;
  columns: BoardColumnDef[];
  teamMembers: TeamMemberDef[];
  accentColor: string;
  tasks: Task[];
  draggingId: string | null;
  isDragOver: boolean;
  onOpenTask: (taskId: string) => void;
  onToggleStage: (taskId: string, columnId: string) => void;
  onCardDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
  onColumnDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (event: DragEvent<HTMLDivElement>, columnId: Column) => void;
};

export function BoardColumn({
  column,
  columns,
  teamMembers,
  accentColor,
  tasks,
  draggingId,
  isDragOver,
  onOpenTask,
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
        <span className="column-count">{tasks.length}</span>
      </div>

      <div
        className={`column-cards${isDragOver ? " drag-over" : ""}`}
        data-col={column.id}
        onDragOver={(event) => onColumnDragOver(event, column.id)}
        onDragLeave={onColumnDragLeave}
        onDrop={(event) => onColumnDrop(event, column.id)}
      >
        {tasks.length === 0 ? (
          <div className="column-empty">Drop cards here</div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={columns}
              teamMembers={teamMembers}
              isDragging={draggingId === task.id}
              onOpenDetail={onOpenTask}
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
