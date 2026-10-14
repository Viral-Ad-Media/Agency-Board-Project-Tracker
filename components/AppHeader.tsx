import { Download, LayoutGrid, Settings, Upload, Users } from "lucide-react";
import { useRef } from "react";

type AppHeaderProps = {
  onExport: () => void;
  onImportFile: (file: File) => void;
  onManageColumns: () => void;
  onManageTeam: () => void;
};

export function AppHeader({
  onExport,
  onImportFile,
  onManageColumns,
  onManageTeam,
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
          <span className="brand-sub">Task Tracker</span>
        </div>

        <div className="header-actions">
          <button
            className="btn-ghost"
            type="button"
            onClick={onManageTeam}
            aria-label="Team"
            title="Team"
          >
            <Users size={13} aria-hidden="true" />
            <span className="btn-label">Team</span>
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={onManageColumns}
            aria-label="Columns"
            title="Columns"
          >
            <Settings size={13} aria-hidden="true" />
            <span className="btn-label">Columns</span>
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={onExport}
            aria-label="Export"
            title="Export"
          >
            <Download size={13} aria-hidden="true" />
            <span className="btn-label">Export</span>
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import"
            title="Import"
          >
            <Upload size={13} aria-hidden="true" />
            <span className="btn-label">Import</span>
          </button>
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
        </div>
      </div>
    </header>
  );
}
