export const ONBOARDING_STORAGE_KEY = "agencyBoard_onboarding_v1";

export type TourStep = {
  id: string;
  targetId: string;
  title: string;
  body: string;
  placement: "top" | "bottom";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "views",
    targetId: "view-toggle",
    title: "Board, Projects, Subscriptions, and Activity",
    body: "Board is your kanban view. Projects groups tasks under a timeline, requirements, and costed resources. Subscriptions tracks every tool and app the agency pays for. Activity shows who did what, most recent first.",
    placement: "bottom",
  },
  {
    id: "summary",
    targetId: "summary-bar",
    title: "Track your board at a glance",
    body: "Total, overdue, due-soon, and completed counts update live as you work.",
    placement: "bottom",
  },
  {
    id: "add-task",
    targetId: "add-task-btn",
    title: "Create a task",
    body: "Start here to add a new task card with a client, deadline, priority, and assignees.",
    placement: "bottom",
  },
  {
    id: "filters",
    targetId: "filter-bar",
    title: "Search and filter",
    body: "Find tasks by name or client, or narrow the board down to one assignee or priority.",
    placement: "bottom",
  },
  {
    id: "board",
    targetId: "board",
    title: "Drag cards across columns",
    body: "Move a card to a new column to update its status. Click a card to see full details and subtasks.",
    placement: "top",
  },
  {
    id: "team",
    targetId: "team-btn",
    title: "Invite your team",
    body: "Invite teammates by email so they can log in and get assigned to tasks and subtasks.",
    placement: "bottom",
  },
  {
    id: "columns",
    targetId: "columns-btn",
    title: "Customize your workflow",
    body: "Rename, reorder, add, or remove columns to match how your team actually works.",
    placement: "bottom",
  },
];

export function normalizeOnboardingSeen(value: unknown): boolean {
  return value === true;
}
