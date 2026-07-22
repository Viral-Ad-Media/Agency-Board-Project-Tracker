import { Download, LayoutGrid, Settings, Upload } from "lucide-react";
import { useRef } from "react";

type AppHeaderProps = {
  onExport: () => void;
  onImportFile: (file: File) => void;
  onManageColumns: () => void;
};

export function AppHeader({ onExport, onImportFile, onManageColumns }: AppHeaderProps) {
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
          <span className="brand-sub">Project Tracker</span>
        </div>

        <div className="header-actions">
          <button className="btn-ghost" type="button" onClick={onManageColumns}>
            <Settings size={13} aria-hidden="true" />
            Columns
          </button>
          <button className="btn-ghost" type="button" onClick={onExport}>
            <Download size={13} aria-hidden="true" />
            Export
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={13} aria-hidden="true" />
            Import
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
