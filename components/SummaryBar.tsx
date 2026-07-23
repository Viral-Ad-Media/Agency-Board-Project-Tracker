import { Plus } from "lucide-react";

type SummaryStats = {
  total: number;
  overdue: number;
  dueSoon: number;
  completed: number;
};

type SummaryBarProps = {
  stats: SummaryStats;
  onAddTask: () => void;
};

export function SummaryBar({ stats, onAddTask }: SummaryBarProps) {
  return (
    <section className="summary-bar" aria-label="Task summary">
      <SummaryStat tone="total" value={stats.total} label="Total Tasks" />
      <SummaryStat tone="overdue" value={stats.overdue} label="Overdue" />
      <SummaryStat tone="duesoon" value={stats.dueSoon} label="Due Soon" />
      <SummaryStat tone="live" value={stats.completed} label="Completed" />
      <div className="summary-spacer" />
      <button className="btn-add-task" type="button" onClick={onAddTask}>
        <Plus size={15} />
        Initiate Task
      </button>
    </section>
  );
}

function SummaryStat({
  tone,
  value,
  label,
}: {
  tone: "total" | "overdue" | "duesoon" | "live";
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
