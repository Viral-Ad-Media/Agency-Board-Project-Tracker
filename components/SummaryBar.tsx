import { Plus } from "lucide-react";

type SummaryStats = {
  total: number;
  overdue: number;
  live: number;
};

type SummaryBarProps = {
  stats: SummaryStats;
  onAddProject: () => void;
};

export function SummaryBar({ stats, onAddProject }: SummaryBarProps) {
  return (
    <section className="summary-bar" aria-label="Project summary">
      <SummaryStat tone="total" value={stats.total} label="Total Projects" />
      <SummaryStat tone="overdue" value={stats.overdue} label="Overdue" />
      <SummaryStat tone="live" value={stats.live} label="Live" />
      <div className="summary-spacer" />
      <button className="btn-add-project" type="button" onClick={onAddProject}>
        <Plus size={15} />
        Initiate Project
      </button>
    </section>
  );
}

function SummaryStat({
  tone,
  value,
  label,
}: {
  tone: "total" | "overdue" | "live";
  value: number;
  label: string;
}) {
  return (
    <div className={`summary-stat ${tone}`}>
      <span className="summary-stat-value">{value}</span>
      <span className="summary-stat-label">{label}</span>
    </div>
  );
}
