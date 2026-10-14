import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActivityEntityType,
  ActivityEntry,
  BillingCycle,
  BoardColumnDef,
  Priority,
  Project,
  ProjectFeature,
  ProjectRequirement,
  ProjectResource,
  ProjectStatus,
  ResourceCategory,
  ResourceStatus,
  Subtask,
  Task,
  TaskAttachment,
  TeamMember,
  WorkspaceResource,
} from "./tasks";

const ACTIVITY_LOG_LIMIT = 100;
export const ATTACHMENTS_BUCKET = "task-attachments";

// ---------------------------------------------------------------------------
// Row shapes (hand-written to match supabase/migrations/0001_init.sql).
// Regenerate via the Supabase MCP `generate_typescript_types` tool once a
// real project exists, and swap these for the generated `Database` type.
// ---------------------------------------------------------------------------

type DbBoardColumn = {
  id: string;
  workspace_id: string;
  name: string;
  counts_as_complete: boolean;
  position: number;
};

type DbSubtask = {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  assignee_id: string | null;
  position: number;
};

type DbTaskAttachment = {
  id: string;
  task_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  content_type: string;
  uploaded_by: string | null;
  created_at: string;
};

type DbTask = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  name: string;
  client: string;
  desc: string;
  column_id: string;
  priority: Priority;
  deadline: string | null;
  stages: Record<string, boolean>;
  created_at: string;
  task_assignees?: { member_id: string }[] | null;
  subtasks?: DbSubtask[] | null;
  attachments?: DbTaskAttachment[] | null;
};

type DbWorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  display_name: string;
  role: "owner" | "member";
  status: "invited" | "active";
};

type DbProject = {
  id: string;
  workspace_id: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
};

type DbProjectChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  position: number;
};

type DbProjectResource = {
  id: string;
  name: string;
  cost: number;
  notes: string;
  position: number;
};

type DbWorkspaceResource = {
  id: string;
  name: string;
  category: ResourceCategory;
  cost: number;
  billing_cycle: BillingCycle;
  status: ResourceStatus;
  renewal_date: string | null;
  url: string;
  notes: string;
  owner_id: string | null;
  created_at: string;
};

type DbActivityEntry = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  entity_type: ActivityEntityType;
  summary: string;
  created_at: string;
};

export type WorkspaceMember = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  role: "owner" | "member";
  status: "invited" | "active";
};

export type CurrentWorkspace = {
  id: string;
  name: string;
  userId: string;
};

export type BoardData = {
  columns: BoardColumnDef[];
  members: WorkspaceMember[];
  tasks: Task[];
  projects: Project[];
  resourceTotals: Record<string, number>;
  workspaceResources: WorkspaceResource[];
  activityLog: ActivityEntry[];
};

export type ProjectDetail = {
  features: ProjectFeature[];
  requirements: ProjectRequirement[];
  resources: ProjectResource[];
};

// ---------------------------------------------------------------------------
// Mappers: DB row -> app-level type (kept identical to the shapes the
// existing, storage-agnostic presentational components already expect).
// ---------------------------------------------------------------------------

function mapColumn(row: DbBoardColumn): BoardColumnDef {
  return { id: row.id, name: row.name, countsAsComplete: row.counts_as_complete };
}

function mapMember(row: DbWorkspaceMember): WorkspaceMember {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.display_name,
    role: row.role,
    status: row.status,
  };
}

export function toTeamMemberDefs(members: WorkspaceMember[]) {
  return members.map((member) => ({ id: member.id, name: member.name }));
}

function mapSubtask(row: DbSubtask): Subtask {
  return { id: row.id, title: row.title, done: row.done, assignee: row.assignee_id ?? "" };
}

function mapAttachment(row: DbTaskAttachment): TaskAttachment {
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    contentType: row.content_type,
    uploadedBy: row.uploaded_by ?? "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapTask(row: DbTask): Task {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    desc: row.desc,
    column: row.column_id,
    assignees: (row.task_assignees ?? []).map((assignee) => assignee.member_id),
    priority: row.priority,
    deadline: row.deadline ?? "",
    stages: row.stages ?? {},
    subtasks: (row.subtasks ?? []).slice().sort((a, b) => a.position - b.position).map(mapSubtask),
    attachments: (row.attachments ?? [])
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(mapAttachment),
    createdAt: new Date(row.created_at).getTime(),
    projectId: row.project_id ?? "",
  };
}

function mapProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    description: row.description,
    status: row.status,
    startDate: row.start_date ?? "",
    targetDate: row.target_date ?? "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapChecklistItem(row: DbProjectChecklistItem): ProjectFeature | ProjectRequirement {
  return { id: row.id, title: row.title, done: row.done };
}

function mapResource(row: DbProjectResource): ProjectResource {
  return { id: row.id, name: row.name, cost: row.cost, notes: row.notes };
}

function mapWorkspaceResource(row: DbWorkspaceResource): WorkspaceResource {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    cost: row.cost,
    billingCycle: row.billing_cycle,
    status: row.status,
    renewalDate: row.renewal_date ?? "",
    url: row.url,
    notes: row.notes,
    ownerId: row.owner_id ?? "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mapActivityEntry(row: DbActivityEntry): ActivityEntry {
  return {
    id: row.id,
    actorId: row.actor_id ?? "",
    actorName: row.actor_name,
    entityType: row.entity_type,
    summary: row.summary,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function orThrow<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Workspace + board bootstrap
// ---------------------------------------------------------------------------

export async function getCurrentWorkspace(
  supabase: SupabaseClient,
): Promise<CurrentWorkspace | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // `.limit(1)` guards against a user somehow ending up with more than one
  // active membership (multi-workspace membership isn't supported yet, see
  // the accept_invite guard in the migration) — without it, more than one
  // row here would make `.maybeSingle()` throw and crash the whole page.
  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, joined_at, workspaces(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);

  const membership = memberships?.[0];
  if (!membership) return null;

  const workspace = membership.workspaces as unknown as { name: string } | null;

  return { id: membership.workspace_id as string, name: workspace?.name ?? "", userId: user.id };
}

export async function bootstrapWorkspace(supabase: SupabaseClient, workspaceName: string) {
  const { data, error } = await supabase.rpc("bootstrap_workspace", {
    workspace_name: workspaceName,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getBoardData(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<BoardData> {
  const [
    columnsRes,
    membersRes,
    tasksRes,
    projectsRes,
    resourcesRes,
    workspaceResourcesRes,
    activityRes,
  ] = await Promise.all([
    supabase
      .from("board_columns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("position"),
    supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("tasks")
      .select("*, task_assignees(member_id), subtasks(*), attachments:task_attachments(*)")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("project_resources")
      .select("project_id, cost")
      .eq("workspace_id", workspaceId),
    supabase
      .from("workspace_resources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at"),
    supabase
      .from("activity_log")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LOG_LIMIT),
  ]);

  const resourceTotals: Record<string, number> = {};
  orThrow<{ project_id: string; cost: number }[]>(resourcesRes).forEach((row) => {
    resourceTotals[row.project_id] = (resourceTotals[row.project_id] ?? 0) + row.cost;
  });

  return {
    columns: orThrow<DbBoardColumn[]>(columnsRes).map(mapColumn),
    members: orThrow<DbWorkspaceMember[]>(membersRes).map(mapMember),
    tasks: orThrow<DbTask[]>(tasksRes).map(mapTask),
    projects: orThrow<DbProject[]>(projectsRes).map(mapProject),
    resourceTotals,
    workspaceResources: orThrow<DbWorkspaceResource[]>(workspaceResourcesRes).map(
      mapWorkspaceResource,
    ),
    activityLog: orThrow<DbActivityEntry[]>(activityRes).map(mapActivityEntry),
  };
}

export async function getProjectDetail(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectDetail> {
  const [featuresRes, requirementsRes, resourcesRes] = await Promise.all([
    supabase
      .from("project_features")
      .select("*")
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("project_requirements")
      .select("*")
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("project_resources")
      .select("*")
      .eq("project_id", projectId)
      .order("position"),
  ]);

  return {
    features: orThrow<DbProjectChecklistItem[]>(featuresRes).map(mapChecklistItem),
    requirements: orThrow<DbProjectChecklistItem[]>(requirementsRes).map(mapChecklistItem),
    resources: orThrow<DbProjectResource[]>(resourcesRes).map(mapResource),
  };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(
  supabase: SupabaseClient,
  workspaceId: string,
  task: {
    id: string;
    name: string;
    client: string;
    desc: string;
    deadline: string;
    priority: Priority;
    assignees: TeamMember[];
    columnId: string;
    stages: Record<string, boolean>;
    projectId?: string | null;
  },
) {
  const { error } = await supabase.from("tasks").insert({
    id: task.id,
    workspace_id: workspaceId,
    project_id: task.projectId ?? null,
    name: task.name,
    client: task.client,
    desc: task.desc,
    column_id: task.columnId,
    priority: task.priority,
    deadline: task.deadline || null,
    stages: task.stages,
  });
  if (error) throw new Error(error.message);

  if (task.assignees.length > 0) {
    const { error: assigneeError } = await supabase.from("task_assignees").insert(
      task.assignees.map((memberId) => ({
        task_id: task.id,
        member_id: memberId,
        workspace_id: workspaceId,
      })),
    );
    if (assigneeError) throw new Error(assigneeError.message);
  }
}

export async function updateTask(
  supabase: SupabaseClient,
  workspaceId: string,
  taskId: string,
  fields: {
    name: string;
    client: string;
    desc: string;
    deadline: string;
    priority: Priority;
    assignees: TeamMember[];
    projectId: string;
  },
) {
  const { error } = await supabase
    .from("tasks")
    .update({
      name: fields.name,
      client: fields.client,
      desc: fields.desc,
      deadline: fields.deadline || null,
      priority: fields.priority,
      project_id: fields.projectId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId);
  if (deleteError) throw new Error(deleteError.message);

  if (fields.assignees.length > 0) {
    const { error: insertError } = await supabase.from("task_assignees").insert(
      fields.assignees.map((memberId) => ({
        task_id: taskId,
        member_id: memberId,
        workspace_id: workspaceId,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  }
}

export async function deleteTask(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
}

export async function moveTaskToColumn(
  supabase: SupabaseClient,
  taskId: string,
  columnId: string,
  stages: Record<string, boolean>,
) {
  const { error } = await supabase
    .from("tasks")
    .update({ column_id: columnId, stages, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
}

export async function persistTaskStages(
  supabase: SupabaseClient,
  taskId: string,
  stages: Record<string, boolean>,
) {
  const { error } = await supabase
    .from("tasks")
    .update({ stages, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------

export async function addSubtask(
  supabase: SupabaseClient,
  workspaceId: string,
  taskId: string,
  subtaskId: string,
  title: string,
  position: number,
) {
  const { error } = await supabase.from("subtasks").insert({
    id: subtaskId,
    task_id: taskId,
    workspace_id: workspaceId,
    title,
    done: false,
    assignee_id: null,
    position,
  });
  if (error) throw new Error(error.message);
}

export async function toggleSubtask(supabase: SupabaseClient, subtaskId: string, done: boolean) {
  const { error } = await supabase.from("subtasks").update({ done }).eq("id", subtaskId);
  if (error) throw new Error(error.message);
}

export async function assignSubtask(
  supabase: SupabaseClient,
  subtaskId: string,
  assignee: "" | TeamMember,
) {
  const { error } = await supabase
    .from("subtasks")
    .update({ assignee_id: assignee || null })
    .eq("id", subtaskId);
  if (error) throw new Error(error.message);
}

export async function deleteSubtask(supabase: SupabaseClient, subtaskId: string) {
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

export async function renameColumn(supabase: SupabaseClient, columnId: string, name: string) {
  const { error } = await supabase.from("board_columns").update({ name }).eq("id", columnId);
  if (error) throw new Error(error.message);
}

export async function toggleColumnComplete(
  supabase: SupabaseClient,
  columnId: string,
  countsAsComplete: boolean,
) {
  const { error } = await supabase
    .from("board_columns")
    .update({ counts_as_complete: countsAsComplete })
    .eq("id", columnId);
  if (error) throw new Error(error.message);
}

export async function reorderColumns(supabase: SupabaseClient, columns: BoardColumnDef[]) {
  const results = await Promise.all(
    columns.map((column, index) =>
      supabase.from("board_columns").update({ position: index }).eq("id", column.id),
    ),
  );
  results.forEach(({ error }) => {
    if (error) throw new Error(error.message);
  });
}

export async function addColumn(
  supabase: SupabaseClient,
  workspaceId: string,
  columnId: string,
  name: string,
  position: number,
) {
  const { error } = await supabase.from("board_columns").insert({
    id: columnId,
    workspace_id: workspaceId,
    name,
    counts_as_complete: false,
    position,
  });
  if (error) throw new Error(error.message);
}

export async function deleteColumn(supabase: SupabaseClient, columnId: string) {
  const { error } = await supabase.from("board_columns").delete().eq("id", columnId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Team / invites (owner-gated by RLS; RPCs used where the caller isn't a
// member yet, e.g. reading invite metadata before accepting).
// ---------------------------------------------------------------------------

export async function createInvite(supabase: SupabaseClient, email: string, name: string) {
  const { data, error } = await supabase.rpc("create_invite", {
    invitee_email: email,
    invitee_name: name,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getWorkspaceMembers(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data as DbWorkspaceMember[]).map(mapMember);
}

export async function removeMember(supabase: SupabaseClient, memberId: string) {
  const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
}

export async function getInviteInfo(supabase: SupabaseClient, token: string) {
  const { data, error } = await supabase.rpc("get_invite_by_token", { token });
  if (error) throw new Error(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as
    | { workspace_name: string; email: string; status: string }
    | undefined;

  return row ? { workspaceName: row.workspace_name, email: row.email, status: row.status } : null;
}

export async function acceptInvite(supabase: SupabaseClient, token: string) {
  const { data, error } = await supabase.rpc("accept_invite", { token });
  if (error) throw new Error(error.message);
  return data as string;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(
  supabase: SupabaseClient,
  workspaceId: string,
  project: {
    id: string;
    name: string;
    client: string;
    description: string;
    status: ProjectStatus;
    startDate: string;
    targetDate: string;
  },
) {
  const { error } = await supabase.from("projects").insert({
    id: project.id,
    workspace_id: workspaceId,
    name: project.name,
    client: project.client,
    description: project.description,
    status: project.status,
    start_date: project.startDate || null,
    target_date: project.targetDate || null,
  });
  if (error) throw new Error(error.message);
}

export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  fields: {
    name: string;
    client: string;
    description: string;
    status: ProjectStatus;
    startDate: string;
    targetDate: string;
  },
) {
  const { error } = await supabase
    .from("projects")
    .update({
      name: fields.name,
      client: fields.client,
      description: fields.description,
      status: fields.status,
      start_date: fields.startDate || null,
      target_date: fields.targetDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
}

export async function deleteProject(supabase: SupabaseClient, projectId: string) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
}

export async function addProjectFeature(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
  featureId: string,
  title: string,
  position: number,
) {
  const { error } = await supabase.from("project_features").insert({
    id: featureId,
    project_id: projectId,
    workspace_id: workspaceId,
    title,
    done: false,
    position,
  });
  if (error) throw new Error(error.message);
}

export async function toggleProjectFeature(
  supabase: SupabaseClient,
  featureId: string,
  done: boolean,
) {
  const { error } = await supabase.from("project_features").update({ done }).eq("id", featureId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectFeature(supabase: SupabaseClient, featureId: string) {
  const { error } = await supabase.from("project_features").delete().eq("id", featureId);
  if (error) throw new Error(error.message);
}

export async function addProjectRequirement(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
  requirementId: string,
  title: string,
  position: number,
) {
  const { error } = await supabase.from("project_requirements").insert({
    id: requirementId,
    project_id: projectId,
    workspace_id: workspaceId,
    title,
    done: false,
    position,
  });
  if (error) throw new Error(error.message);
}

export async function toggleProjectRequirement(
  supabase: SupabaseClient,
  requirementId: string,
  done: boolean,
) {
  const { error } = await supabase
    .from("project_requirements")
    .update({ done })
    .eq("id", requirementId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectRequirement(supabase: SupabaseClient, requirementId: string) {
  const { error } = await supabase.from("project_requirements").delete().eq("id", requirementId);
  if (error) throw new Error(error.message);
}

export async function addProjectResource(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
  resourceId: string,
  name: string,
  cost: number,
  notes: string,
  position: number,
) {
  const { error } = await supabase.from("project_resources").insert({
    id: resourceId,
    project_id: projectId,
    workspace_id: workspaceId,
    name,
    cost,
    notes,
    position,
  });
  if (error) throw new Error(error.message);
}

export async function updateProjectResource(
  supabase: SupabaseClient,
  resourceId: string,
  fields: { name: string; cost: number; notes: string },
) {
  const { error } = await supabase
    .from("project_resources")
    .update({ name: fields.name, cost: fields.cost, notes: fields.notes })
    .eq("id", resourceId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectResource(supabase: SupabaseClient, resourceId: string) {
  const { error } = await supabase.from("project_resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Workspace resources (agency-wide tools & subscriptions)
// ---------------------------------------------------------------------------

export async function createWorkspaceResource(
  supabase: SupabaseClient,
  workspaceId: string,
  resource: {
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
  },
) {
  const { error } = await supabase.from("workspace_resources").insert({
    id: resource.id,
    workspace_id: workspaceId,
    name: resource.name,
    category: resource.category,
    cost: resource.cost,
    billing_cycle: resource.billingCycle,
    status: resource.status,
    renewal_date: resource.renewalDate || null,
    url: resource.url,
    notes: resource.notes,
    owner_id: resource.ownerId || null,
  });
  if (error) throw new Error(error.message);
}

export async function updateWorkspaceResource(
  supabase: SupabaseClient,
  resourceId: string,
  fields: {
    name: string;
    category: ResourceCategory;
    cost: number;
    billingCycle: BillingCycle;
    status: ResourceStatus;
    renewalDate: string;
    url: string;
    notes: string;
    ownerId: string;
  },
) {
  const { error } = await supabase
    .from("workspace_resources")
    .update({
      name: fields.name,
      category: fields.category,
      cost: fields.cost,
      billing_cycle: fields.billingCycle,
      status: fields.status,
      renewal_date: fields.renewalDate || null,
      url: fields.url,
      notes: fields.notes,
      owner_id: fields.ownerId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);
  if (error) throw new Error(error.message);
}

export async function deleteWorkspaceResource(supabase: SupabaseClient, resourceId: string) {
  const { error } = await supabase.from("workspace_resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Workspace settings
// ---------------------------------------------------------------------------

export async function updateWorkspaceName(
  supabase: SupabaseClient,
  workspaceId: string,
  name: string,
) {
  const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function logActivity(
  supabase: SupabaseClient,
  workspaceId: string,
  actorId: string,
  actorName: string,
  entityType: ActivityEntityType,
  summary: string,
) {
  const { error } = await supabase.from("activity_log").insert({
    workspace_id: workspaceId,
    actor_id: actorId,
    actor_name: actorName,
    entity_type: entityType,
    summary,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Task attachments (Supabase Storage)
// ---------------------------------------------------------------------------

export async function uploadTaskAttachment(
  supabase: SupabaseClient,
  workspaceId: string,
  taskId: string,
  file: File,
): Promise<TaskAttachment> {
  const storagePath = `${workspaceId}/${taskId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      workspace_id: workspaceId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || "application/octet-stream",
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    // Roll back the uploaded object so it doesn't become an orphan if the
    // metadata row fails to insert (e.g. an RLS or validation error).
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  return mapAttachment(data as DbTaskAttachment);
}

export async function deleteTaskAttachment(
  supabase: SupabaseClient,
  attachmentId: string,
  storagePath: string,
) {
  const { error: storageError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("task_attachments").delete().eq("id", attachmentId);
  if (error) throw new Error(error.message);
}

export async function getAttachmentDownloadUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 5);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// Re-inserts a `task_attachments` metadata row for a file whose Storage object
// still exists (deleting a task cascades the metadata row, but never touches
// Storage) — used by Board.tsx's task-delete Undo so a restored task keeps its
// attachments instead of leaving their files orphaned with no reference.
export async function restoreTaskAttachment(
  supabase: SupabaseClient,
  workspaceId: string,
  taskId: string,
  attachment: TaskAttachment,
) {
  const { error } = await supabase.from("task_attachments").insert({
    id: attachment.id,
    task_id: taskId,
    workspace_id: workspaceId,
    storage_path: attachment.storagePath,
    file_name: attachment.fileName,
    file_size: attachment.fileSize,
    content_type: attachment.contentType,
    uploaded_by: attachment.uploadedBy || null,
  });
  if (error) throw new Error(error.message);
}
