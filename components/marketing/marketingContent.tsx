import {
  CreditCard,
  FolderKanban,
  History,
  LayoutGrid,
  Paperclip,
  Users,
  type LucideIcon,
} from "lucide-react";

export type MarketingFeature = {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  points: string[];
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    id: "board",
    icon: LayoutGrid,
    title: "A kanban board shaped to your workflow",
    summary:
      "Move work through columns you name, order, and define yourself — not a fixed pipeline.",
    points: [
      "Rename, reorder, add, and remove columns; mark which ones count as complete",
      "Drag cards between columns, with earlier stages marked done automatically",
      "Multiple assignees, priorities, deadlines, and per-task subtask checklists",
      "Overdue and due-soon warnings, plus search and filters by assignee, priority, and project",
    ],
  },
  {
    id: "projects",
    icon: FolderKanban,
    title: "Projects with a timeline and a budget",
    summary:
      "Group tasks under a project and keep its scope, schedule, and costs in one place.",
    points: [
      "Start and target dates, status, and client for every project",
      "Feature and requirement checklists that track what is done",
      "Costed resource lines with a running total per project",
      "Jump from a project straight to its filtered board",
    ],
  },
  {
    id: "subscriptions",
    icon: CreditCard,
    title: "Every tool and subscription, accounted for",
    summary:
      "See what the agency pays for, who owns each tool, and what is about to renew.",
    points: [
      "Cost, billing cycle, category, status, and renewal date per tool",
      "Estimated monthly and annual spend, normalized across billing cycles",
      "Renewal warnings so nothing auto-renews unnoticed",
      "Sort the table and export it to CSV",
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Real accounts for your whole team",
    summary:
      "Invite teammates by email. Everyone gets their own login inside your workspace.",
    points: [
      "Shareable invite links for each teammate",
      "Owners manage the roster and workspace settings",
      "Changes sync live across everyone in the workspace",
    ],
  },
  {
    id: "activity",
    icon: History,
    title: "An activity feed of who did what",
    summary:
      "A running log of changes across tasks, projects, columns, team, and subscriptions.",
    points: [
      "Readable summaries instead of raw diffs",
      "Append-only: entries can't be edited or erased by members",
    ],
  },
  {
    id: "attachments",
    icon: Paperclip,
    title: "Files attached right to the task",
    summary: "Keep briefs, assets, and deliverables with the work they belong to.",
    points: [
      "Upload files to any task, up to 10 MB each",
      "Stored privately and served through short-lived links",
      "Only members of your workspace can open them",
    ],
  },
];
