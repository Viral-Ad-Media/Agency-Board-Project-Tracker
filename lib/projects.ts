export type BoardColumnDef = {
  id: string;
  name: string;
  countsAsComplete: boolean;
};

export const DEFAULT_COLUMNS: BoardColumnDef[] = [
  { id: "initiate", name: "Initiate", countsAsComplete: false },
  { id: "briefing", name: "Briefing", countsAsComplete: false },
  { id: "in-production", name: "In Production", countsAsComplete: false },
  { id: "review", name: "Review", countsAsComplete: false },
  { id: "done", name: "Done", countsAsComplete: true },
  { id: "live", name: "Live", countsAsComplete: true },
];

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const TEAM_MEMBERS = ["Wale", "Beejay", "Dami", "Mabel", "Laguda", "Mide"] as const;
export const PROJECT_STORAGE_KEY = "agencyBoard_v2";
export const COLUMNS_STORAGE_KEY = "agencyBoard_columns_v1";
export const DUE_SOON_WINDOW_DAYS = 3;

export type Column = string;
export type Priority = (typeof PRIORITIES)[number];
export type TeamMember = (typeof TEAM_MEMBERS)[number];

export type Task = {
  id: string;
  title: string;
  done: boolean;
  assignee: "" | TeamMember;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  desc: string;
  column: Column;
  assignees: TeamMember[];
  priority: Priority;
  deadline: string;
  stages: Record<string, boolean>;
  tasks: Task[];
  createdAt: number;
};

export type ProjectFormState = {
  name: string;
  client: string;
  desc: string;
  deadline: string;
  priority: "" | Priority;
  assignees: TeamMember[];
};

export type InvalidField = keyof ProjectFormState;

export const AVATAR_COLORS: Record<TeamMember, string> = {
  Wale: "#5a5aff",
  Beejay: "#b05aff",
  Dami: "#ff6b2b",
  Mabel: "#00cc88",
  Laguda: "#ffaa00",
  Mide: "#00e5ff",
};

export const REQUIRED_FIELDS: InvalidField[] = [
  "name",
  "client",
  "deadline",
  "priority",
  "assignees",
];

export function createEmptyForm(): ProjectFormState {
  return {
    name: "",
    client: "",
    desc: "",
    deadline: "",
    priority: "",
    assignees: [],
  };
}

export function getMissingFields(formData: ProjectFormState): InvalidField[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = formData[field];
    return Array.isArray(value) ? value.length === 0 : !value.trim();
  });
}

export function generateId(prefix: string = "p") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

function isTeamMember(value: unknown): value is TeamMember {
  return typeof value === "string" && TEAM_MEMBERS.includes(value as TeamMember);
}

export function findColumn(columns: BoardColumnDef[], columnId: string) {
  return columns.find((column) => column.id === columnId);
}

export function isColumnComplete(columns: BoardColumnDef[], columnId: string) {
  return Boolean(findColumn(columns, columnId)?.countsAsComplete);
}

export function normalizeColumns(value: unknown): BoardColumnDef[] {
  if (!Array.isArray(value)) return DEFAULT_COLUMNS;

  const columns = value
    .map((item): BoardColumnDef | null => {
      if (!item || typeof item !== "object") return null;

      const source = item as Record<string, unknown>;
      const id = typeof source.id === "string" && source.id ? source.id : "";
      const name = typeof source.name === "string" ? source.name.trim() : "";

      if (!id || !name) return null;

      return { id, name, countsAsComplete: Boolean(source.countsAsComplete) };
    })
    .filter((column): column is BoardColumnDef => Boolean(column));

  return columns.length > 0 ? columns : DEFAULT_COLUMNS;
}

function resolveColumnId(value: unknown, columns: BoardColumnDef[]): string {
  const fallback = columns[0]?.id ?? "";
  if (typeof value !== "string") return fallback;

  return (
    columns.find((column) => column.id === value)?.id ??
    columns.find((column) => column.name === value)?.id ??
    fallback
  );
}

function resolveStages(value: unknown, columns: BoardColumnDef[]): Record<string, boolean> {
  const record: Record<string, boolean> = {};

  if (Array.isArray(value)) {
    columns.forEach((column, index) => {
      record[column.id] = Boolean(value[index]);
    });
  } else if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    columns.forEach((column) => {
      record[column.id] = Boolean(source[column.id]);
    });
  } else {
    columns.forEach((column) => {
      record[column.id] = false;
    });
  }

  return record;
}

function resolveAssignees(source: Record<string, unknown>): TeamMember[] {
  if (Array.isArray(source.assignees)) {
    return source.assignees.filter(isTeamMember);
  }

  if (isTeamMember(source.assignee)) {
    return [source.assignee];
  }

  return [];
}

function resolveTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): Task | null => {
      if (!item || typeof item !== "object") return null;

      const source = item as Record<string, unknown>;
      const title = typeof source.title === "string" ? source.title.trim() : "";
      if (!title) return null;

      return {
        id: typeof source.id === "string" && source.id ? source.id : generateId("task"),
        title,
        done: Boolean(source.done),
        assignee: isTeamMember(source.assignee) ? source.assignee : "",
      };
    })
    .filter((task): task is Task => Boolean(task));
}

export function normalizeProject(value: unknown, columns: BoardColumnDef[]): Project | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const client = typeof source.client === "string" ? source.client.trim() : "";

  if (!name || !client) return null;

  const assignees = resolveAssignees(source);

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name,
    client,
    desc: typeof source.desc === "string" ? source.desc : "",
    column: resolveColumnId(source.column, columns),
    assignees: assignees.length > 0 ? assignees : [TEAM_MEMBERS[0]],
    priority: isPriority(source.priority) ? source.priority : "Medium",
    deadline: typeof source.deadline === "string" ? source.deadline : "",
    stages: resolveStages(source.stages, columns),
    tasks: resolveTasks(source.tasks),
    createdAt: typeof source.createdAt === "number" ? source.createdAt : Date.now(),
  };
}

export function createSeedProject(columns: BoardColumnDef[]): Project {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  const stages: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    stages[column.id] = index === 0;
  });

  return {
    id: generateId(),
    name: "Automated SEO Topical Authority",
    client: "Internal",
    desc: "Build an AI-powered system that writes and publishes daily SEO-optimized blog posts with affiliate link insertion across multiple niche blogs.",
    column: columns[0]?.id ?? "",
    assignees: ["Wale"],
    priority: "High",
    deadline: deadline.toISOString().split("T")[0],
    stages,
    tasks: [
      { id: generateId("task"), title: "Draft content calendar", done: true, assignee: "Wale" },
      { id: generateId("task"), title: "Set up publishing pipeline", done: false, assignee: "" },
    ],
    createdAt: Date.now(),
  };
}

export function formatDate(value: string) {
  if (!value) return "-";

  const [year, month, day] = value.split("-");
  const monthIndex = Number.parseInt(month, 10) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!year || !day || Number.isNaN(monthIndex) || !months[monthIndex]) return value;
  return `${day} ${months[monthIndex]} ${year}`;
}

export function daysUntilDeadline(project: Project): number | null {
  if (!project.deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${project.deadline}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;

  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(project: Project, columns: BoardColumnDef[]) {
  if (isColumnComplete(columns, project.column)) return false;

  const days = daysUntilDeadline(project);
  return days !== null && days < 0;
}

export function isDueSoon(project: Project, columns: BoardColumnDef[]) {
  if (isColumnComplete(columns, project.column)) return false;

  const days = daysUntilDeadline(project);
  return days !== null && days >= 0 && days <= DUE_SOON_WINDOW_DAYS;
}

export function syncStagesWithColumn(
  stages: Record<string, boolean>,
  columns: BoardColumnDef[],
  targetColumnId: string,
): Record<string, boolean> {
  const targetIndex = columns.findIndex((column) => column.id === targetColumnId);
  const next: Record<string, boolean> = { ...stages };

  columns.forEach((column, index) => {
    if (stages[column.id] || index < targetIndex || (index === targetIndex && column.countsAsComplete)) {
      next[column.id] = true;
    }
  });

  return next;
}

export function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase() || "--";
}

export function countCompleteStages(project: Project, columns: BoardColumnDef[]) {
  return columns.filter((column) => project.stages[column.id]).length;
}

export function countCompleteTasks(project: Project) {
  return project.tasks.filter((task) => task.done).length;
}

export function priorityClass(priority: Priority) {
  return priority.toLowerCase();
}
