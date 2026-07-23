import { Check } from "lucide-react";
import { Fragment } from "react";
import type { BoardColumnDef, Task } from "../lib/tasks";

type PipelineTrackProps = {
  task: Task;
  columns: BoardColumnDef[];
  isDetail?: boolean;
  onToggleStage: (taskId: string, columnId: string) => void;
};

export function PipelineTrack({ task, columns, isDetail = false, onToggleStage }: PipelineTrackProps) {
  return (
    <div className={isDetail ? "detail-pipeline-track" : "pipeline-track"}>
      {columns.map((column, index) => {
        const complete = Boolean(task.stages[column.id]);
        const nextColumn = columns[index + 1];
        const connectorComplete = complete && Boolean(nextColumn && task.stages[nextColumn.id]);

        return (
          <Fragment key={column.id}>
            <button
              className={`stage-bubble${complete ? " complete" : ""}`}
              type="button"
              title={column.name}
              aria-pressed={complete}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStage(task.id, column.id);
              }}
            >
              <span className="stage-dot">
                <Check size={12} aria-hidden="true" />
              </span>
              <span className="stage-label">{column.name}</span>
            </button>

            {index < columns.length - 1 ? (
              <span className={`pipeline-connector${connectorComplete ? " done" : ""}`} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
