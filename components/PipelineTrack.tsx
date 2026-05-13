import { Check } from "lucide-react";
import { Fragment } from "react";
import { COLUMNS, STAGE_LABELS, type Project } from "../lib/projects";

type PipelineTrackProps = {
  project: Project;
  isDetail?: boolean;
  onToggleStage: (projectId: string, stageIndex: number) => void;
};

export function PipelineTrack({
  project,
  isDetail = false,
  onToggleStage,
}: PipelineTrackProps) {
  return (
    <div className={isDetail ? "detail-pipeline-track" : "pipeline-track"}>
      {COLUMNS.map((column, index) => {
        const complete = project.stages[index];
        const connectorComplete = complete && project.stages[index + 1];

        return (
          <Fragment key={column}>
            <button
              className={`stage-bubble${complete ? " complete" : ""}`}
              type="button"
              title={column}
              aria-pressed={complete}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStage(project.id, index);
              }}
            >
              <span className="stage-dot">
                <Check size={12} aria-hidden="true" />
              </span>
              <span className="stage-label">{STAGE_LABELS[index]}</span>
            </button>

            {index < COLUMNS.length - 1 ? (
              <span className={`pipeline-connector${connectorComplete ? " done" : ""}`} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
