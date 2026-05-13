export const COLUMNS = [
  "Initiate",
  "Briefing",
  "In Production",
  "Review",
  "Done",
  "Live",
] as const;

export const STAGE_LABELS = [
  "Initiate",
  "Briefing",
  "Production",
  "Review",
  "Done",
  "Live",
] as const;

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const TEAM_MEMBERS = ["Wale", "Beejay", "Dami", "Mabel", "Laguda", "Mide"] as const;
export const PROJECT_STORAGE_KEY = "agencyBoard_v2";

export type Column = (typeof COLUMNS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type TeamMember = (typeof TEAM_MEMBERS)[number];

export type Project = {
  id: string;
  name: string;
  client: string;
  desc: string;
  column: Column;
  assignee: string;
  priority: Priority;
  deadline: string;
  stages: boolean[];
  createdAt: number;
};

export type ProjectFormState = {
  name: string;
  client: string;
  desc: string;
  deadline: string;
  priority: "" | Priority;
  assignee: "" | TeamMember;
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
  "assignee",
];

export function createEmptyForm(): ProjectFormState {
  return {
    name: "",
    client: "",
    desc: "",
    deadline: "",
    priority: "",
    assignee: "",
  };
}

export function generateId() {
  return `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isColumn(value: unknown): value is Column {
  return typeof value === "string" && COLUMNS.includes(value as Column);
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

export function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const stageValues = Array.isArray(source.stages) ? source.stages : [];
  const stages = COLUMNS.map((_, index) => Boolean(stageValues[index]));
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const client = typeof source.client === "string" ? source.client.trim() : "";

  if (!name || !client) return null;

  return {
    id: typeof source.id === "string" && source.id ? source.id : generateId(),
    name,
    client,
    desc: typeof source.desc === "string" ? source.desc : "",
    column: isColumn(source.column) ? source.column : "Initiate",
    assignee: typeof source.assignee === "string" ? source.assignee : "Wale",
    priority: isPriority(source.priority) ? source.priority : "Medium",
    deadline: typeof source.deadline === "string" ? source.deadline : "",
    stages,
    createdAt: typeof source.createdAt === "number" ? source.createdAt : Date.now(),
  };
}

export function createSeedProject(): Project {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  const stages = Array(COLUMNS.length).fill(false);
  stages[0] = true;

  return {
    id: generateId(),
    name: "Automated SEO Topical Authority",
    client: "Internal",
    desc: "Build an AI-powered system that writes and publishes daily SEO-optimized blog posts with affiliate link insertion across multiple niche blogs.",
    column: "Initiate",
    assignee: "Wale",
    priority: "High",
    deadline: deadline.toISOString().split("T")[0],
    stages,
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

export function isOverdue(project: Project) {
  if (!project.deadline || project.column === "Done" || project.column === "Live") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${project.deadline}T00:00:00`) < today;
}

export function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase() || "--";
}

export function countCompleteStages(project: Project) {
  return project.stages.filter(Boolean).length;
}

export function priorityClass(priority: Priority) {
  return priority.toLowerCase();
}
