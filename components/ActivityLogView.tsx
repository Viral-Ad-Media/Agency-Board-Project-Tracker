import {
  Building2,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Settings,
  Users,
} from "lucide-react";
import type { ActivityEntityType, ActivityEntry } from "../lib/tasks";

type ActivityLogViewProps = {
  activity: ActivityEntry[];
  currentUserId: string;
};

const ENTITY_ICONS: Record<ActivityEntityType, typeof ClipboardList> = {
  task: ClipboardList,
  project: FolderKanban,
  column: Settings,
  member: Users,
  resource: CreditCard,
  workspace: Building2,
};

function formatActivityTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLogView({ activity, currentUserId }: ActivityLogViewProps) {
  return (
    <section className="projects-view" aria-label="Activity">
      <div className="projects-view-header">
        <div>
          <h2 className="projects-view-title">Activity</h2>
          <p className="projects-view-subtitle">
            Who did what, most recent first.
          </p>
        </div>
      </div>

      {activity.length === 0 ? (
        <div className="projects-empty">
          <p>Nothing has happened here yet — actions across the workspace will show up here.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {activity.map((entry) => {
            const Icon = ENTITY_ICONS[entry.entityType] ?? ClipboardList;
            const actorLabel = entry.actorId === currentUserId ? "You" : entry.actorName;

            return (
              <li className="activity-row" key={entry.id}>
                <span className="activity-icon" aria-hidden="true">
                  <Icon size={14} />
                </span>
                <span className="activity-summary">
                  <strong>{actorLabel}</strong> {entry.summary}
                </span>
                <span className="activity-time">{formatActivityTime(entry.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
