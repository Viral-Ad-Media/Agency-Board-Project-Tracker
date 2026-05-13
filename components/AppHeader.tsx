import { LayoutGrid } from "lucide-react";

export function AppHeader() {
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
      </div>
    </header>
  );
}
