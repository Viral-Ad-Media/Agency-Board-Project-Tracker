import {
  CircleHelp,
  CreditCard,
  Download,
  FolderKanban,
  History,
  LayoutGrid,
  LogOut,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { useRef } from "react";
import { Tooltip } from "./Tooltip";

type AppView = "board" | "projects" | "resources" | "activity";

type AppHeaderProps = {
  workspaceName?: string;
  view?: AppView;
  onViewChange?: (view: AppView) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onManageColumns: () => void;
  onManageTeam: () => void;
  onManageWorkspace?: () => void;
  onReplayTour: () => void;
  onSignOut?: () => void;
};

export function AppHeader({
  workspaceName,
  view = "board",
  onViewChange,
  onExport,
  onImportFile,
  onManageColumns,
  onManageTeam,
  onManageWorkspace,
  onReplayTour,
  onSignOut,
}: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="brand-mark" aria-hidden="true">
            <LayoutGrid size={16} strokeWidth={2.4} />
          </div>
          <span className="brand-name">Agency Board</span>
          <span className="brand-divider" />
          {onManageWorkspace ? (
            <Tooltip label="Workspace settings" placement="bottom">
              <button className="brand-sub brand-sub-btn" type="button" onClick={onManageWorkspace}>
                {workspaceName || "Task Tracker"}
              </button>
            </Tooltip>
          ) : (
            <span className="brand-sub">{workspaceName || "Task Tracker"}</span>
          )}
        </div>

        {onViewChange ? (
          <div
            className="header-view-toggle"
            role="tablist"
            aria-label="View"
            data-tour-id="view-toggle"
          >
            <button
              className={`view-toggle-btn${view === "board" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={view === "board"}
              onClick={() => onViewChange("board")}
            >
              <LayoutGrid size={13} aria-hidden="true" />
              Board
            </button>
            <button
              className={`view-toggle-btn${view === "projects" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={view === "projects"}
              onClick={() => onViewChange("projects")}
            >
              <FolderKanban size={13} aria-hidden="true" />
              Projects
            </button>
            <button
              className={`view-toggle-btn${view === "resources" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={view === "resources"}
              onClick={() => onViewChange("resources")}
            >
              <CreditCard size={13} aria-hidden="true" />
              Subscriptions
            </button>
            <button
              className={`view-toggle-btn${view === "activity" ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={view === "activity"}
              onClick={() => onViewChange("activity")}
            >
              <History size={13} aria-hidden="true" />
              Activity
            </button>
          </div>
        ) : null}

        <div className="header-actions">
          <Tooltip label="Replay the product tour" placement="bottom">
            <button className="btn-ghost" type="button" onClick={onReplayTour}>
              <CircleHelp size={13} aria-hidden="true" />
              Help
            </button>
          </Tooltip>
          <Tooltip label="Add or remove team members" placement="bottom">
            <button
              className="btn-ghost"
              type="button"
              data-tour-id="team-btn"
              onClick={onManageTeam}
            >
              <Users size={13} aria-hidden="true" />
              Team
            </button>
          </Tooltip>
          <Tooltip label="Rename, reorder, add, or remove columns" placement="bottom">
            <button
              className="btn-ghost"
              type="button"
              data-tour-id="columns-btn"
              onClick={onManageColumns}
            >
              <Settings size={13} aria-hidden="true" />
              Columns
            </button>
          </Tooltip>
          <Tooltip label="Download the board as a JSON file" placement="bottom">
            <button className="btn-ghost" type="button" onClick={onExport}>
              <Download size={13} aria-hidden="true" />
              Export
            </button>
          </Tooltip>
          <Tooltip label="Restore the board from a JSON file" placement="bottom">
            <button
              className="btn-ghost"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} aria-hidden="true" />
              Import
            </button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportFile(file);
              event.target.value = "";
            }}
          />
          {onSignOut ? (
            <Tooltip label="Sign out" placement="bottom">
              <button className="btn-ghost" type="button" onClick={onSignOut}>
                <LogOut size={13} aria-hidden="true" />
                Sign Out
              </button>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </header>
  );
}
