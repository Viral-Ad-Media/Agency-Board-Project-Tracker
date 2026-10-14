export type BoardColumnDef = {
  id: string;
  name: string;
  countsAsComplete: boolean;
};

export type TeamMemberDef = {
  id: string;
  name: string;
};

export const AVATAR_PALETTE = ["#5a5aff", "#b05aff", "#ff6b2b", "#00cc88", "#ffaa00", "#00e5ff"];

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const DUE_SOON_WINDOW_DAYS = 3;

export type Column = string;
export type Priority = (typeof PRIORITIES)[number];
export type TeamMember = string;

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
  assignee: "" | TeamMember;
};

export type TaskAttachment = {
  id: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  createdAt: number;
};

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type Task = {
  id: string;
  name: string;
  client: string;
  desc: string;
  column: Column;
  assignees: TeamMember[];
  priority: Priority;
  deadline: string;
  stages: Record<string, boolean>;
  subtasks: Subtask[];
  attachments: TaskAttachment[];
  createdAt: number;
  projectId: string;
};

export type TaskFormState = {
  name: string;
  client: string;
  desc: string;
  deadline: string;
  priority: "" | Priority;
  assignees: TeamMember[];
  projectId: string;
};

export type InvalidField = keyof TaskFormState;

export const REQUIRED_FIELDS: InvalidField[] = [
  "name",
  "client",
  "deadline",
  "priority",
  "assignees",
];

export function createEmptyForm(): TaskFormState {
  return {
    name: "",
    client: "",
    desc: "",
    deadline: "",
    priority: "",
    assignees: [],
    projectId: "",
  };
}

export function getMissingFields(formData: TaskFormState): InvalidField[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = formData[field];
    return Array.isArray(value) ? value.length === 0 : !value.trim();
  });
}

export function generateId(prefix: string = "t") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

export function findColumn(columns: BoardColumnDef[], columnId: string) {
  return columns.find((column) => column.id === columnId);
}

export function isColumnComplete(columns: BoardColumnDef[], columnId: string) {
  return Boolean(findColumn(columns, columnId)?.countsAsComplete);
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

export function findTeamMember(teamMembers: TeamMemberDef[], memberId: string) {
  return teamMembers.find((member) => member.id === memberId);
}

export function getMemberName(teamMembers: TeamMemberDef[], memberId: string) {
  return findTeamMember(teamMembers, memberId)?.name ?? memberId;
}

export function getAvatarColor(teamMembers: TeamMemberDef[], memberId: string) {
  const index = teamMembers.findIndex((member) => member.id === memberId);
  return AVATAR_PALETTE[index === -1 ? 0 : index % AVATAR_PALETTE.length];
}

function resolveMemberId(value: unknown, teamMembers: TeamMemberDef[]): string | null {
  if (typeof value !== "string" || !value) return null;

  return (
    teamMembers.find((member) => member.id === value)?.id ??
    teamMembers.find((member) => member.name === value)?.id ??
    null
  );
}

function resolveAssignees(
  source: Record<string, unknown>,
  teamMembers: TeamMemberDef[],
): TeamMember[] {
  const raw = Array.isArray(source.assignees)
    ? source.assignees
    : typeof source.assignee === "string"
      ? [source.assignee]
      : [];

  const resolved = raw
    .map((item) => resolveMemberId(item, teamMembers))
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(resolved));
}

function resolveSubtasks(value: unknown, teamMembers: TeamMemberDef[]): Subtask[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): Subtask | null => {
      if (!item || typeof item !== "object") return null;

      const source = item as Record<string, unknown>;
      const title = typeof source.title === "string" ? source.title.trim() : "";
      if (!title) return null;

      return {
        id: typeof source.id === "string" && source.id ? source.id : generateId("subtask"),
        title,
        done: Boolean(source.done),
        assignee: resolveMemberId(source.assignee, teamMembers) ?? "",
      };
    })
    .filter((subtask): subtask is Subtask => Boolean(subtask));
}

function resolveProjectId(value: unknown, projects: { id: string; name: string }[]): string {
  if (typeof value !== "string" || !value) return "";

  return (
    projects.find((project) => project.id === value)?.id ??
    projects.find((project) => project.name === value)?.id ??
    ""
  );
}

export function normalizeTask(
  value: unknown,
  columns: BoardColumnDef[],
  teamMembers: TeamMemberDef[],
  projects: { id: string; name: string }[] = [],
): Task | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const client = typeof source.client === "string" ? source.client.trim() : "";

  if (!name || !client) return null;

  const assignees = resolveAssignees(source, teamMembers);
  const rawSubtasks = Array.isArray(source.subtasks) ? source.subtasks : source.tasks;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name,
    client,
    desc: typeof source.desc === "string" ? source.desc : "",
    column: resolveColumnId(source.column, columns),
    assignees: assignees.length > 0 ? assignees : [teamMembers[0]?.id ?? ""],
    priority: isPriority(source.priority) ? source.priority : "Medium",
    deadline: typeof source.deadline === "string" ? source.deadline : "",
    stages: resolveStages(source.stages, columns),
    subtasks: resolveSubtasks(rawSubtasks, teamMembers),
    // Attachments live in Supabase Storage and can't be reconstructed from JSON,
    // so imported/duplicated tasks always start with none.
    attachments: [],
    createdAt: typeof source.createdAt === "number" ? source.createdAt : Date.now(),
    projectId: resolveProjectId(source.projectId, projects),
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

export function daysUntilDeadline(task: Task): number | null {
  if (!task.deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${task.deadline}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;

  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(task: Task, columns: BoardColumnDef[]) {
  if (isColumnComplete(columns, task.column)) return false;

  const days = daysUntilDeadline(task);
  return days !== null && days < 0;
}

export function isDueSoon(task: Task, columns: BoardColumnDef[]) {
  if (isColumnComplete(columns, task.column)) return false;

  const days = daysUntilDeadline(task);
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

export function countCompleteStages(task: Task, columns: BoardColumnDef[]) {
  return columns.filter((column) => task.stages[column.id]).length;
}

export function countCompleteSubtasks(task: Task) {
  return task.subtasks.filter((subtask) => subtask.done).length;
}

export function priorityClass(priority: Priority) {
  return priority.toLowerCase();
}

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  createdAt: number;
};

export function getProjectName(projects: Project[], projectId: string): string {
  return projects.find((project) => project.id === projectId)?.name ?? "";
}

export type ProjectChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

export type ProjectFeature = ProjectChecklistItem;
export type ProjectRequirement = ProjectChecklistItem;

export type ProjectResource = {
  id: string;
  name: string;
  cost: number;
  notes: string;
};

export function computeProjectCost(resources: ProjectResource[]): number {
  return resources.reduce((sum, resource) => sum + resource.cost, 0);
}

export function projectStatusLabel(status: ProjectStatus) {
  switch (status) {
    case "on_hold":
      return "On Hold";
    case "planning":
    case "active":
    case "completed":
      return status[0].toUpperCase() + status.slice(1);
    default:
      return status;
  }
}

export const RESOURCE_CATEGORIES = ["software", "hosting", "marketing", "finance", "other"] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const BILLING_CYCLES = ["monthly", "yearly", "weekly", "one_time"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const RESOURCE_STATUSES = ["active", "trial", "cancelled"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_RENEWAL_WINDOW_DAYS = 14;

export type WorkspaceResource = {
  id: string;
  name: string;
  category: ResourceCategory;
  cost: number;
  billingCycle: BillingCycle;
  status: ResourceStatus;
  renewalDate: string;
  url: string;
  notes: string;
  ownerId: string;
  createdAt: number;
};

export function resourceCategoryLabel(category: ResourceCategory) {
  switch (category) {
    case "software":
      return "Software";
    case "hosting":
      return "Hosting";
    case "marketing":
      return "Marketing";
    case "finance":
      return "Finance";
    case "other":
    default:
      return "Other";
  }
}

export function billingCycleLabel(cycle: BillingCycle) {
  switch (cycle) {
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "weekly":
      return "Weekly";
    case "one_time":
    default:
      return "One-time";
  }
}

export function resourceStatusLabel(status: ResourceStatus) {
  switch (status) {
    case "trial":
      return "Trial";
    case "cancelled":
      return "Cancelled";
    case "active":
    default:
      return "Active";
  }
}

const WEEKS_PER_MONTH = 52 / 12;

export function normalizedMonthlyCost(resource: WorkspaceResource): number {
  if (resource.status === "cancelled") return 0;

  switch (resource.billingCycle) {
    case "monthly":
      return resource.cost;
    case "yearly":
      return resource.cost / 12;
    case "weekly":
      return resource.cost * WEEKS_PER_MONTH;
    case "one_time":
    default:
      return 0;
  }
}

export function computeMonthlySpend(resources: WorkspaceResource[]): number {
  return resources.reduce((sum, resource) => sum + normalizedMonthlyCost(resource), 0);
}

export function isRenewalDueSoon(resource: WorkspaceResource): boolean {
  if (!resource.renewalDate || resource.status === "cancelled") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(`${resource.renewalDate}T00:00:00`);
  if (Number.isNaN(renewal.getTime())) return false;

  const days = Math.round((renewal.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= RESOURCE_RENEWAL_WINDOW_DAYS;
}

export type ActivityEntityType = "task" | "project" | "column" | "member" | "resource" | "workspace";

export type ActivityEntry = {
  id: string;
  actorId: string;
  actorName: string;
  entityType: ActivityEntityType;
  summary: string;
  createdAt: number;
};
