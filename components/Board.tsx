"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { ActivityLogView } from "./ActivityLogView";
import { AppHeader } from "./AppHeader";
import { ColumnSettingsModal } from "./ColumnSettingsModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { EmptyBoardState } from "./EmptyBoardState";
import { FilterBar } from "./FilterBar";
import { ImportConfirmModal } from "./ImportConfirmModal";
import { ProductTour } from "./ProductTour";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { ProjectFormModal, type ProjectFormState } from "./ProjectFormModal";
import { ProjectsView } from "./ProjectsView";
import { ResourceFormModal, type ResourceFormState } from "./ResourceFormModal";
import { SubscriptionsView } from "./SubscriptionsView";
import { SummaryBar } from "./SummaryBar";
import { TaskBoard } from "./TaskBoard";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskFormModal } from "./TaskFormModal";
import { TeamSettingsModal } from "./TeamSettingsModal";
import { UndoToast } from "./UndoToast";
import { WelcomeModal } from "./WelcomeModal";
import { WorkspaceSettingsModal } from "./WorkspaceSettingsModal";
import { ONBOARDING_STORAGE_KEY, normalizeOnboardingSeen } from "../lib/onboarding";
import {
  createEmptyForm,
  generateId,
  getMissingFields,
  isColumnComplete,
  isDueSoon,
  isOverdue,
  normalizeTask,
  syncStagesWithColumn,
  type BoardColumnDef,
  type Column,
  type InvalidField,
  type Priority,
  type Project,
  type Task,
  type TaskFormState,
  type TeamMember,
} from "../lib/tasks";
import { createClient } from "../lib/supabase/client";
import * as workspaceApi from "../lib/workspace";
import { toTeamMemberDefs, type CurrentWorkspace, type WorkspaceMember } from "../lib/workspace";
import type {
  ActivityEntityType,
  ActivityEntry,
  TaskAttachment,
  WorkspaceResource,
} from "../lib/tasks";

const UNDO_WINDOW_MS = 6000;
const REALTIME_DEBOUNCE_MS = 400;

function createEmptyProjectForm(): ProjectFormState {
  return { name: "", client: "", description: "", status: "planning", startDate: "", targetDate: "" };
}

function createEmptyResourceForm(): ResourceFormState {
  return {
    name: "",
    category: "software",
    cost: "",
    billingCycle: "monthly",
    status: "active",
    renewalDate: "",
    url: "",
    notes: "",
    ownerId: "",
  };
}

type BoardProps = {
  workspace: CurrentWorkspace;
  initialColumns: BoardColumnDef[];
  initialMembers: WorkspaceMember[];
  initialTasks: Task[];
  initialProjects: Project[];
  initialResourceTotals: Record<string, number>;
  initialWorkspaceResources: WorkspaceResource[];
  initialActivityLog: ActivityEntry[];
};

export function Board({
  workspace,
  initialColumns,
  initialMembers,
  initialTasks,
  initialProjects,
  initialResourceTotals,
  initialWorkspaceResources,
  initialActivityLog,
}: BoardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [columns, setColumns] = useState<BoardColumnDef[]>(initialColumns);
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [resourceTotals, setResourceTotals] = useState<Record<string, number>>(
    initialResourceTotals,
  );
  const [workspaceResources, setWorkspaceResources] = useState<WorkspaceResource[]>(
    initialWorkspaceResources,
  );
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(initialActivityLog);
  const [view, setView] = useState<"board" | "projects" | "resources" | "activity">("board");
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [isResourceFormInvalid, setIsResourceFormInvalid] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceFormData, setResourceFormData] = useState<ResourceFormState>(() =>
    createEmptyResourceForm(),
  );
  const [boardProjectFilter, setBoardProjectFilter] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectFormInvalid, setIsProjectFormInvalid] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  const [projectFormData, setProjectFormData] = useState<ProjectFormState>(() =>
    createEmptyProjectForm(),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Column | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const [pendingDeleteResourceId, setPendingDeleteResourceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormState>(() => createEmptyForm());
  const [invalidFields, setInvalidFields] = useState<Set<InvalidField>>(() => new Set());
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState<"" | Priority>("");
  const [lastDeleted, setLastDeleted] = useState<{ task: Task; index: number } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; tasks: Task[] } | null>(
    null,
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const invalidTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const projectInvalidTimerRef = useRef<number | null>(null);
  const resourceInvalidTimerRef = useRef<number | null>(null);

  const teamMembers = useMemo(() => toTeamMemberDefs(members), [members]);
  const currentMember = useMemo(
    () => members.find((member) => member.userId === workspace.userId) ?? null,
    [members, workspace.userId],
  );
  const isOwner = currentMember?.role === "owner";

  useEffect(() => {
    try {
      const rawOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      const onboardingSeen = rawOnboarding
        ? normalizeOnboardingSeen(JSON.parse(rawOnboarding))
        : false;
      setIsWelcomeOpen(!onboardingSeen);
    } catch (error) {
      console.warn("onboarding localStorage read failed:", error);
      setIsWelcomeOpen(true);
    }
  }, []);

  const refreshBoard = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(async () => {
      try {
        const data = await workspaceApi.getBoardData(supabase, workspace.id);
        setColumns(data.columns);
        setMembers(data.members);
        setTasks(data.tasks);
        setProjects(data.projects);
        setResourceTotals(data.resourceTotals);
        setWorkspaceResources(data.workspaceResources);
        setActivityLog(data.activityLog);
      } catch (error) {
        console.error("Realtime refresh failed:", error);
      }
    }, REALTIME_DEBOUNCE_MS);
  }, [supabase, workspace.id]);

  useEffect(() => {
    const filter = `workspace_id=eq.${workspace.id}`;
    const channel = supabase
      .channel(`workspace-${workspace.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter }, refreshBoard)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignees", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_columns", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_members", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_resources", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_resources", filter },
        refreshBoard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log", filter },
        refreshBoard,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, workspace.id, refreshBoard]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (pendingImport) {
        setPendingImport(null);
      } else if (pendingDeleteId) {
        setPendingDeleteId(null);
      } else if (isColumnSettingsOpen) {
        setIsColumnSettingsOpen(false);
      } else if (isTeamSettingsOpen) {
        setIsTeamSettingsOpen(false);
      } else if (isWelcomeOpen) {
        setIsWelcomeOpen(false);
        markOnboardingSeen();
      } else if (isFormOpen) {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData(createEmptyForm());
        setInvalidFields(new Set());
      } else if (isProjectFormOpen) {
        closeProjectFormModal();
      } else if (isResourceFormOpen) {
        closeResourceFormModal();
      } else if (viewingProjectId) {
        setViewingProjectId(null);
      } else if (viewingId) {
        setViewingId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    pendingImport,
    pendingDeleteId,
    isColumnSettingsOpen,
    isTeamSettingsOpen,
    isWelcomeOpen,
    isFormOpen,
    isProjectFormOpen,
    isResourceFormOpen,
    viewingProjectId,
    viewingId,
  ]);

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current !== null) {
        window.clearTimeout(invalidTimerRef.current);
      }
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      if (projectInvalidTimerRef.current !== null) {
        window.clearTimeout(projectInvalidTimerRef.current);
      }
      if (resourceInvalidTimerRef.current !== null) {
        window.clearTimeout(resourceInvalidTimerRef.current);
      }
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      overdue: tasks.filter((task) => isOverdue(task, columns)).length,
      dueSoon: tasks.filter((task) => isDueSoon(task, columns)).length,
      completed: tasks.filter((task) => isColumnComplete(columns, task.column)).length,
    }),
    [tasks, columns],
  );

  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      counts[task.column] = (counts[task.column] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  const teamMemberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      task.assignees.forEach((memberId) => {
        counts[memberId] = (counts[memberId] ?? 0) + 1;
      });
      task.subtasks.forEach((subtask) => {
        if (subtask.assignee) {
          counts[subtask.assignee] = (counts[subtask.assignee] ?? 0) + 1;
        }
      });
    });
    return counts;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (boardProjectFilter && task.projectId !== boardProjectFilter) return false;
      if (filterAssignee && !task.assignees.includes(filterAssignee)) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (!query) return true;

      return (
        task.name.toLowerCase().includes(query) ||
        task.client.toLowerCase().includes(query) ||
        task.desc.toLowerCase().includes(query)
      );
    });
  }, [tasks, search, filterAssignee, filterPriority, boardProjectFilter]);

  const isFiltering = Boolean(
    search.trim() || filterAssignee || filterPriority || boardProjectFilter,
  );

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.projectId) {
        counts[task.projectId] = (counts[task.projectId] ?? 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const viewingProject = viewingProjectId
    ? projects.find((project) => project.id === viewingProjectId) ?? null
    : null;

  const pendingDeleteProjectName = pendingDeleteProjectId
    ? (projects.find((project) => project.id === pendingDeleteProjectId)?.name ?? "")
    : "";

  const pendingDeleteResourceName = pendingDeleteResourceId
    ? (workspaceResources.find((resource) => resource.id === pendingDeleteResourceId)?.name ?? "")
    : "";

  function clearFilters() {
    setSearch("");
    setFilterAssignee("");
    setFilterPriority("");
  }

  const viewingTask = viewingId ? tasks.find((task) => task.id === viewingId) ?? null : null;
  const pendingDeleteTask = pendingDeleteId
    ? tasks.find((task) => task.id === pendingDeleteId) ?? null
    : null;

  function reportError(error: unknown, message: string) {
    console.error(error);
    window.alert(message);
  }

  const logActivity = useCallback(
    (entityType: ActivityEntityType, summary: string) => {
      const actorName = currentMember?.name ?? "Someone";
      workspaceApi
        .logActivity(supabase, workspace.id, workspace.userId, actorName, entityType, summary)
        .catch((error) => {
          console.warn("Couldn't record activity log entry:", error);
        });
    },
    [supabase, workspace.id, workspace.userId, currentMember],
  );

  function setFormValue(
    key: "name" | "client" | "desc" | "deadline" | "priority" | "projectId",
    value: string,
  ) {
    setFormData((current) => ({ ...current, [key]: value }) as TaskFormState);
    setInvalidFields((current) => {
      if (!current.has(key)) return current;

      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function toggleAssignee(member: TeamMember) {
    setFormData((current) => ({
      ...current,
      assignees: current.assignees.includes(member)
        ? current.assignees.filter((existing) => existing !== member)
        : [...current.assignees, member],
    }));
    setInvalidFields((current) => {
      if (!current.has("assignees")) return current;

      const next = new Set(current);
      next.delete("assignees");
      return next;
    });
  }

  function openAddModal() {
    setEditingId(null);
    setFormData(createEmptyForm());
    setInvalidFields(new Set());
    setIsFormOpen(true);
  }

  function openEditModal(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    setEditingId(id);
    setFormData({
      name: task.name,
      client: task.client,
      desc: task.desc,
      deadline: task.deadline,
      priority: task.priority,
      assignees: task.assignees,
      projectId: task.projectId,
    });
    setInvalidFields(new Set());
    setIsFormOpen(true);
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(createEmptyForm());
    setInvalidFields(new Set());
  }

  function closeDetailModal() {
    setViewingId(null);
  }

  function closeConfirmModal() {
    setPendingDeleteId(null);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missingFields = getMissingFields(formData);
    if (missingFields.length > 0) {
      setInvalidFields(new Set(missingFields));
      if (invalidTimerRef.current !== null) {
        window.clearTimeout(invalidTimerRef.current);
      }
      invalidTimerRef.current = window.setTimeout(() => setInvalidFields(new Set()), 2000);
      return;
    }

    const cleanTaskFields = {
      name: formData.name.trim(),
      client: formData.client.trim(),
      desc: formData.desc.trim(),
      deadline: formData.deadline,
      priority: formData.priority as Priority,
      assignees: formData.assignees,
      projectId: formData.projectId,
    };

    if (editingId) {
      const targetId = editingId;
      setTasks((current) =>
        current.map((task) => (task.id === targetId ? { ...task, ...cleanTaskFields } : task)),
      );
      closeFormModal();
      closeDetailModal();

      try {
        await workspaceApi.updateTask(supabase, workspace.id, targetId, cleanTaskFields);
        logActivity("task", `updated task "${cleanTaskFields.name}"`);
      } catch (error) {
        reportError(error, "Couldn't save your changes. Please refresh and try again.");
      }
      return;
    }

    const initialStages: Record<string, boolean> = {};
    columns.forEach((column) => {
      initialStages[column.id] = false;
    });

    const newTask: Task = {
      id: generateId(),
      ...cleanTaskFields,
      column: columns[0]?.id ?? "",
      stages: initialStages,
      subtasks: [],
      attachments: [],
      createdAt: Date.now(),
    };

    setTasks((current) => [...current, newTask]);
    closeFormModal();
    closeDetailModal();

    try {
      await workspaceApi.createTask(supabase, workspace.id, {
        id: newTask.id,
        name: newTask.name,
        client: newTask.client,
        desc: newTask.desc,
        deadline: newTask.deadline,
        priority: newTask.priority,
        assignees: newTask.assignees,
        columnId: newTask.column,
        stages: newTask.stages,
        projectId: newTask.projectId,
      });
      logActivity("task", `created task "${newTask.name}"`);
    } catch (error) {
      setTasks((current) => current.filter((task) => task.id !== newTask.id));
      reportError(error, "Couldn't create that task. Please try again.");
    }
  }

  const toggleStage = useCallback(
    (taskId: string, columnId: string) => {
      let nextStages: Record<string, boolean> | null = null;

      setTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId) return task;
          nextStages = { ...task.stages, [columnId]: !task.stages[columnId] };
          return { ...task, stages: nextStages };
        }),
      );

      if (nextStages) {
        workspaceApi.persistTaskStages(supabase, taskId, nextStages).catch((error) => {
          reportError(error, "Couldn't save that change. Please refresh and try again.");
        });
      }
    },
    [supabase],
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggingId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverColumn(null);
  }, []);

  const handleColumnDragOver = useCallback((event: DragEvent<HTMLDivElement>, column: Column) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(column);
  }, []);

  const handleColumnDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const moveTaskToColumn = useCallback(
    (taskId: string, targetColumn: Column) => {
      let nextStages: Record<string, boolean> | null = null;
      let movedTaskName = "";

      setTasks((current) =>
        current.map((task) => {
          if (task.id !== taskId || task.column === targetColumn) return task;
          nextStages = syncStagesWithColumn(task.stages, columns, targetColumn);
          movedTaskName = task.name;
          return { ...task, column: targetColumn, stages: nextStages };
        }),
      );

      if (nextStages) {
        workspaceApi
          .moveTaskToColumn(supabase, taskId, targetColumn, nextStages)
          .then(() => {
            const columnName = columns.find((column) => column.id === targetColumn)?.name ?? "";
            logActivity("task", `moved "${movedTaskName}" to ${columnName}`);
          })
          .catch((error) => {
            reportError(error, "Couldn't move that task. Please refresh and try again.");
          });
      }
    },
    [columns, supabase, logActivity],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetColumn: Column) => {
      event.preventDefault();
      const taskId = draggingId ?? event.dataTransfer.getData("text/plain");

      setDragOverColumn(null);
      setDraggingId(null);

      if (!taskId) return;

      moveTaskToColumn(taskId, targetColumn);
    },
    [draggingId, moveTaskToColumn],
  );

  function handleEditFromDetail(taskId: string) {
    closeDetailModal();
    openEditModal(taskId);
  }

  function changeTaskProject(taskId: string, projectId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, projectId } : item)),
    );

    workspaceApi
      .updateTask(supabase, workspace.id, taskId, {
        name: task.name,
        client: task.client,
        desc: task.desc,
        deadline: task.deadline,
        priority: task.priority,
        assignees: task.assignees,
        projectId,
      })
      .catch((error) => {
        reportError(error, "Couldn't change that task's project. Please refresh and try again.");
      });
  }

  async function duplicateTask(taskId: string) {
    const original = tasks.find((item) => item.id === taskId);
    if (!original) return;

    const newSubtasks = original.subtasks.map((subtask) => ({
      ...subtask,
      id: generateId("subtask"),
    }));
    const newTask: Task = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      subtasks: newSubtasks,
      // Attachments live in Storage, not just the DB row — deliberately not
      // copied (would need an actual file copy, not just a metadata insert).
      attachments: [],
      createdAt: Date.now(),
    };

    setTasks((current) => [...current, newTask]);
    closeDetailModal();

    try {
      await workspaceApi.createTask(supabase, workspace.id, {
        id: newTask.id,
        name: newTask.name,
        client: newTask.client,
        desc: newTask.desc,
        deadline: newTask.deadline,
        priority: newTask.priority,
        assignees: newTask.assignees,
        columnId: newTask.column,
        stages: newTask.stages,
        projectId: newTask.projectId,
      });

      for (let i = 0; i < newSubtasks.length; i += 1) {
        const subtask = newSubtasks[i];
        await workspaceApi.addSubtask(
          supabase,
          workspace.id,
          newTask.id,
          subtask.id,
          subtask.title,
          i,
        );
        if (subtask.done) {
          await workspaceApi.toggleSubtask(supabase, subtask.id, true);
        }
        if (subtask.assignee) {
          await workspaceApi.assignSubtask(supabase, subtask.id, subtask.assignee);
        }
      }

      logActivity("task", `duplicated "${original.name}" as "${newTask.name}"`);
    } catch (error) {
      setTasks((current) => current.filter((task) => task.id !== newTask.id));
      reportError(error, "Couldn't duplicate that task. Please try again.");
    }
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;

    const taskId = pendingDeleteId;
    const index = tasks.findIndex((task) => task.id === taskId);
    const task = index >= 0 ? tasks[index] : null;

    setTasks((current) => current.filter((item) => item.id !== taskId));
    setPendingDeleteId(null);

    if (viewingId === taskId) {
      setViewingId(null);
    }

    if (task) {
      setLastDeleted({ task, index });
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
      undoTimerRef.current = window.setTimeout(() => setLastDeleted(null), UNDO_WINDOW_MS);

      workspaceApi
        .deleteTask(supabase, taskId)
        .then(() => logActivity("task", `deleted task "${task.name}"`))
        .catch((error) => {
          reportError(error, "Couldn't delete that task on the server. Please refresh.");
        });
    }
  }

  async function undoDelete() {
    if (!lastDeleted) return;

    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const { task, index } = lastDeleted;
    setLastDeleted(null);
    setTasks((current) => {
      if (current.some((item) => item.id === task.id)) return current;

      const next = [...current];
      next.splice(Math.min(index, next.length), 0, task);
      return next;
    });

    try {
      await workspaceApi.createTask(supabase, workspace.id, {
        id: task.id,
        name: task.name,
        client: task.client,
        desc: task.desc,
        deadline: task.deadline,
        priority: task.priority,
        assignees: task.assignees,
        columnId: task.column,
        stages: task.stages,
        projectId: task.projectId,
      });

      for (let i = 0; i < task.subtasks.length; i += 1) {
        const subtask = task.subtasks[i];
        await workspaceApi.addSubtask(supabase, workspace.id, task.id, subtask.id, subtask.title, i);
        if (subtask.done) {
          await workspaceApi.toggleSubtask(supabase, subtask.id, true);
        }
        if (subtask.assignee) {
          await workspaceApi.assignSubtask(supabase, subtask.id, subtask.assignee);
        }
      }

      for (const attachment of task.attachments) {
        await workspaceApi.restoreTaskAttachment(supabase, workspace.id, task.id, attachment);
      }
    } catch (error) {
      reportError(
        error,
        "Restored locally, but couldn't fully sync to the server. Please refresh to confirm.",
      );
    }
  }

  function addSubtask(taskId: string, title: string) {
    const subtaskId = generateId("subtask");
    const position = tasks.find((task) => task.id === taskId)?.subtasks.length ?? 0;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...task.subtasks, { id: subtaskId, title, done: false, assignee: "" }],
            }
          : task,
      ),
    );

    workspaceApi
      .addSubtask(supabase, workspace.id, taskId, subtaskId, title, position)
      .catch((error) => {
        reportError(error, "Couldn't add that subtask. Please refresh and try again.");
      });
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    let nextDone = false;

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) => {
                if (subtask.id !== subtaskId) return subtask;
                nextDone = !subtask.done;
                return { ...subtask, done: nextDone };
              }),
            }
          : task,
      ),
    );

    workspaceApi.toggleSubtask(supabase, subtaskId, nextDone).catch((error) => {
      reportError(error, "Couldn't save that change. Please refresh and try again.");
    });
  }

  function assignSubtask(taskId: string, subtaskId: string, assignee: "" | TeamMember) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, assignee } : subtask,
              ),
            }
          : task,
      ),
    );

    workspaceApi.assignSubtask(supabase, subtaskId, assignee).catch((error) => {
      reportError(error, "Couldn't save that change. Please refresh and try again.");
    });
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId) }
          : task,
      ),
    );

    workspaceApi.deleteSubtask(supabase, subtaskId).catch((error) => {
      reportError(error, "Couldn't delete that subtask. Please refresh and try again.");
    });
  }

  async function uploadAttachment(taskId: string, file: File) {
    setIsUploadingAttachment(true);

    try {
      const attachment = await workspaceApi.uploadTaskAttachment(
        supabase,
        workspace.id,
        taskId,
        file,
      );

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, attachments: [...task.attachments, attachment] }
            : task,
        ),
      );
      logActivity("task", `attached "${file.name}" to a task`);
    } catch (error) {
      reportError(error, "Couldn't upload that file. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function downloadAttachment(attachment: TaskAttachment) {
    try {
      const url = await workspaceApi.getAttachmentDownloadUrl(supabase, attachment.storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      reportError(error, "Couldn't open that file. Please try again.");
    }
  }

  function deleteAttachment(taskId: string, attachmentId: string) {
    const task = tasks.find((item) => item.id === taskId);
    const attachment = task?.attachments.find((item) => item.id === attachmentId);
    if (!attachment) return;

    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, attachments: item.attachments.filter((a) => a.id !== attachmentId) }
          : item,
      ),
    );

    workspaceApi
      .deleteTaskAttachment(supabase, attachmentId, attachment.storagePath)
      .catch((error) => {
        reportError(error, "Couldn't delete that file. Please refresh and try again.");
      });
  }

  function renameColumn(columnId: string, name: string) {
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, name } : column)),
    );

    workspaceApi.renameColumn(supabase, columnId, name).catch((error) => {
      reportError(error, "Couldn't rename that column. Please refresh and try again.");
    });
  }

  function toggleColumnComplete(columnId: string, countsAsComplete: boolean) {
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, countsAsComplete } : column)),
    );

    workspaceApi.toggleColumnComplete(supabase, columnId, countsAsComplete).catch((error) => {
      reportError(error, "Couldn't save that change. Please refresh and try again.");
    });
  }

  function moveColumn(columnId: string, direction: "up" | "down") {
    setColumns((current) => {
      const index = current.findIndex((column) => column.id === columnId);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      workspaceApi.reorderColumns(supabase, next).catch((error) => {
        reportError(error, "Couldn't save the new column order. Please refresh and try again.");
      });

      return next;
    });
  }

  function deleteColumn(columnId: string) {
    const hasCards = (columnCounts[columnId] ?? 0) > 0;
    if (hasCards || columns.length <= 1) return;

    const columnName = columns.find((column) => column.id === columnId)?.name ?? "";
    setColumns((current) => current.filter((column) => column.id !== columnId));

    workspaceApi
      .deleteColumn(supabase, columnId)
      .then(() => logActivity("column", `deleted column "${columnName}"`))
      .catch((error) => {
        reportError(error, "Couldn't delete that column. Please refresh and try again.");
      });
  }

  function addColumn(name: string) {
    const columnId = generateId("col");
    const position = columns.length;

    setColumns((current) => [...current, { id: columnId, name, countsAsComplete: false }]);

    workspaceApi
      .addColumn(supabase, workspace.id, columnId, name, position)
      .then(() => logActivity("column", `added column "${name}"`))
      .catch((error) => {
        reportError(error, "Couldn't add that column. Please refresh and try again.");
      });
  }

  function removeMember(memberId: string) {
    const isInUse = (teamMemberCounts[memberId] ?? 0) > 0;
    if (isInUse) return;

    const memberName = members.find((member) => member.id === memberId)?.name ?? "";
    setMembers((current) => current.filter((member) => member.id !== memberId));

    workspaceApi
      .removeMember(supabase, memberId)
      .then(() => logActivity("member", `removed ${memberName} from the team`))
      .catch((error) => {
        reportError(error, "Couldn't remove that member. Please refresh and try again.");
      });
  }

  async function inviteMember(email: string, name: string) {
    const token = await workspaceApi.createInvite(supabase, email, name);
    try {
      const nextMembers = await workspaceApi.getWorkspaceMembers(supabase, workspace.id);
      setMembers(nextMembers);
    } catch (error) {
      console.warn("Couldn't refresh the roster after inviting:", error);
    }
    logActivity("member", `invited ${name} (${email}) to the team`);
    return token;
  }

  function openAddProjectModal() {
    setEditingProjectId(null);
    setProjectFormData(createEmptyProjectForm());
    setIsProjectFormOpen(true);
  }

  function openEditProjectModal(project: Project) {
    setEditingProjectId(project.id);
    setProjectFormData({
      name: project.name,
      client: project.client,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      targetDate: project.targetDate,
    });
    setViewingProjectId(null);
    setIsProjectFormOpen(true);
  }

  function closeProjectFormModal() {
    setIsProjectFormOpen(false);
    setEditingProjectId(null);
    setProjectFormData(createEmptyProjectForm());
  }

  function setProjectFormValue(key: keyof ProjectFormState, value: string) {
    setProjectFormData((current) => ({ ...current, [key]: value }) as ProjectFormState);
  }

  async function handleProjectFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = projectFormData.name.trim();
    if (!name) {
      setIsProjectFormInvalid(true);
      if (projectInvalidTimerRef.current !== null) {
        window.clearTimeout(projectInvalidTimerRef.current);
      }
      projectInvalidTimerRef.current = window.setTimeout(() => setIsProjectFormInvalid(false), 2000);
      return;
    }

    const cleanFields = {
      name,
      client: projectFormData.client.trim(),
      description: projectFormData.description.trim(),
      status: projectFormData.status,
      startDate: projectFormData.startDate,
      targetDate: projectFormData.targetDate,
    };

    if (editingProjectId) {
      const targetId = editingProjectId;
      setProjects((current) =>
        current.map((project) => (project.id === targetId ? { ...project, ...cleanFields } : project)),
      );
      closeProjectFormModal();

      try {
        await workspaceApi.updateProject(supabase, targetId, cleanFields);
        logActivity("project", `updated project "${cleanFields.name}"`);
      } catch (error) {
        reportError(error, "Couldn't save your changes. Please refresh and try again.");
      }
      return;
    }

    const newProject: Project = {
      id: generateId("project"),
      ...cleanFields,
      createdAt: Date.now(),
    };

    setProjects((current) => [...current, newProject]);
    closeProjectFormModal();

    try {
      await workspaceApi.createProject(supabase, workspace.id, newProject);
      logActivity("project", `created project "${newProject.name}"`);
    } catch (error) {
      setProjects((current) => current.filter((project) => project.id !== newProject.id));
      reportError(error, "Couldn't create that project. Please try again.");
    }
  }

  function deleteProject(projectId: string) {
    const projectName = projects.find((project) => project.id === projectId)?.name ?? "";
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setTasks((current) =>
      current.map((task) => (task.projectId === projectId ? { ...task, projectId: "" } : task)),
    );
    setViewingProjectId(null);
    if (boardProjectFilter === projectId) {
      setBoardProjectFilter("");
    }

    workspaceApi
      .deleteProject(supabase, projectId)
      .then(() => logActivity("project", `deleted project "${projectName}"`))
      .catch((error) => {
        reportError(error, "Couldn't delete that project. Please refresh and try again.");
      });
  }

  function confirmDeleteProject() {
    if (!pendingDeleteProjectId) return;
    const projectId = pendingDeleteProjectId;
    setPendingDeleteProjectId(null);
    deleteProject(projectId);
  }

  function viewProjectBoard(projectId: string) {
    setBoardProjectFilter(projectId);
    setViewingProjectId(null);
    setView("board");
  }

  function openAddResourceModal() {
    setEditingResourceId(null);
    setResourceFormData(createEmptyResourceForm());
    setIsResourceFormOpen(true);
  }

  function openEditResourceModal(resource: WorkspaceResource) {
    setEditingResourceId(resource.id);
    setResourceFormData({
      name: resource.name,
      category: resource.category,
      cost: resource.cost ? String(resource.cost) : "",
      billingCycle: resource.billingCycle,
      status: resource.status,
      renewalDate: resource.renewalDate,
      url: resource.url,
      notes: resource.notes,
      ownerId: resource.ownerId,
    });
    setIsResourceFormOpen(true);
  }

  function closeResourceFormModal() {
    setIsResourceFormOpen(false);
    setEditingResourceId(null);
    setResourceFormData(createEmptyResourceForm());
  }

  function setResourceFormValue(key: keyof ResourceFormState, value: string) {
    setResourceFormData((current) => ({ ...current, [key]: value }) as ResourceFormState);
  }

  async function handleResourceFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = resourceFormData.name.trim();
    if (!name) {
      setIsResourceFormInvalid(true);
      if (resourceInvalidTimerRef.current !== null) {
        window.clearTimeout(resourceInvalidTimerRef.current);
      }
      resourceInvalidTimerRef.current = window.setTimeout(
        () => setIsResourceFormInvalid(false),
        2000,
      );
      return;
    }

    const cleanFields = {
      name,
      category: resourceFormData.category,
      cost: Number.parseFloat(resourceFormData.cost) || 0,
      billingCycle: resourceFormData.billingCycle,
      status: resourceFormData.status,
      renewalDate: resourceFormData.renewalDate,
      url: resourceFormData.url.trim(),
      notes: resourceFormData.notes.trim(),
      ownerId: resourceFormData.ownerId,
    };

    if (editingResourceId) {
      const targetId = editingResourceId;
      setWorkspaceResources((current) =>
        current.map((resource) =>
          resource.id === targetId ? { ...resource, ...cleanFields } : resource,
        ),
      );
      closeResourceFormModal();

      try {
        await workspaceApi.updateWorkspaceResource(supabase, targetId, cleanFields);
        logActivity("resource", `updated subscription "${cleanFields.name}"`);
      } catch (error) {
        reportError(error, "Couldn't save your changes. Please refresh and try again.");
      }
      return;
    }

    const newResource: WorkspaceResource = {
      id: generateId("resource"),
      ...cleanFields,
      createdAt: Date.now(),
    };

    setWorkspaceResources((current) => [...current, newResource]);
    closeResourceFormModal();

    try {
      await workspaceApi.createWorkspaceResource(supabase, workspace.id, newResource);
      logActivity("resource", `added subscription "${newResource.name}"`);
    } catch (error) {
      setWorkspaceResources((current) => current.filter((r) => r.id !== newResource.id));
      reportError(error, "Couldn't add that subscription. Please try again.");
    }
  }

  function deleteResource(resourceId: string) {
    const resourceName = workspaceResources.find((resource) => resource.id === resourceId)?.name ?? "";
    setWorkspaceResources((current) => current.filter((resource) => resource.id !== resourceId));

    workspaceApi
      .deleteWorkspaceResource(supabase, resourceId)
      .then(() => logActivity("resource", `deleted subscription "${resourceName}"`))
      .catch((error) => {
        reportError(error, "Couldn't delete that subscription. Please refresh and try again.");
      });
  }

  function confirmDeleteResource() {
    if (!pendingDeleteResourceId) return;
    const resourceId = pendingDeleteResourceId;
    setPendingDeleteResourceId(null);
    deleteResource(resourceId);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function renameWorkspace(name: string) {
    setIsWorkspaceSettingsOpen(false);
    if (name === workspaceName) return;

    const previousName = workspaceName;
    setWorkspaceName(name);

    try {
      await workspaceApi.updateWorkspaceName(supabase, workspace.id, name);
      logActivity("workspace", `renamed the workspace from "${previousName}" to "${name}"`);
    } catch (error) {
      setWorkspaceName(previousName);
      reportError(error, "Couldn't rename the workspace. Please refresh and try again.");
    }
  }

  function markOnboardingSeen() {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(true));
    } catch (error) {
      console.warn("onboarding localStorage write failed:", error);
    }
  }

  function skipWelcome() {
    setIsWelcomeOpen(false);
    markOnboardingSeen();
  }

  function startTourFromWelcome() {
    setIsWelcomeOpen(false);
    markOnboardingSeen();
    setIsTourActive(true);
  }

  function replayTour() {
    setIsTourActive(true);
  }

  function finishTour() {
    setIsTourActive(false);
  }

  function handleExport() {
    const payload = JSON.stringify(tasks, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().split("T")[0];

    const link = document.createElement("a");
    link.href = url;
    link.download = `agency-board-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const nextTasks = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeTask(item, columns, teamMembers, projects))
              .filter((task): task is Task => Boolean(task))
          : [];

        if (nextTasks.length === 0) {
          window.alert("No valid tasks were found in that file.");
          return;
        }

        setPendingImport({ fileName: file.name, tasks: nextTasks });
      } catch (error) {
        console.warn("import parse failed:", error);
        window.alert("That file isn't valid JSON.");
      }
    };

    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!pendingImport) return;

    const importedTasks = pendingImport.tasks;
    const tasksToRemove = tasks;
    setTasks(importedTasks);
    setPendingImport(null);
    clearFilters();

    try {
      await Promise.all(tasksToRemove.map((task) => workspaceApi.deleteTask(supabase, task.id)));
      for (const task of importedTasks) {
        await workspaceApi.createTask(supabase, workspace.id, {
          id: task.id,
          name: task.name,
          client: task.client,
          desc: task.desc,
          deadline: task.deadline,
          priority: task.priority,
          assignees: task.assignees,
          columnId: task.column,
          stages: task.stages,
          projectId: task.projectId,
        });
        for (let i = 0; i < task.subtasks.length; i += 1) {
          const subtask = task.subtasks[i];
          await workspaceApi.addSubtask(
            supabase,
            workspace.id,
            task.id,
            subtask.id,
            subtask.title,
            i,
          );
          if (subtask.done) {
            await workspaceApi.toggleSubtask(supabase, subtask.id, true);
          }
          if (subtask.assignee) {
            await workspaceApi.assignSubtask(supabase, subtask.id, subtask.assignee);
          }
        }
      }
    } catch (error) {
      reportError(
        error,
        "Import saved locally, but syncing to the server failed partway through. Please refresh to confirm.",
      );
    }
  }

  function cancelImport() {
    setPendingImport(null);
  }

  return (
    <main className="app-shell">
      <AppHeader
        workspaceName={workspaceName}
        view={view}
        onViewChange={setView}
        onExport={handleExport}
        onImportFile={handleImportFile}
        onManageColumns={() => setIsColumnSettingsOpen(true)}
        onManageTeam={() => setIsTeamSettingsOpen(true)}
        onManageWorkspace={() => setIsWorkspaceSettingsOpen(true)}
        onReplayTour={replayTour}
        onSignOut={handleSignOut}
      />
      {view === "projects" ? (
        <ProjectsView
          projects={projects}
          taskCounts={projectTaskCounts}
          resourceTotals={resourceTotals}
          onAddProject={openAddProjectModal}
          onOpenProject={(project) => setViewingProjectId(project.id)}
        />
      ) : view === "resources" ? (
        <SubscriptionsView
          resources={workspaceResources}
          teamMembers={teamMembers}
          onAddResource={openAddResourceModal}
          onEditResource={openEditResourceModal}
          onDeleteResource={setPendingDeleteResourceId}
        />
      ) : view === "activity" ? (
        <ActivityLogView activity={activityLog} currentUserId={workspace.userId} />
      ) : (
        <>
          <SummaryBar stats={stats} onAddTask={openAddModal} />
          <FilterBar
            search={search}
            assignee={filterAssignee}
            priority={filterPriority}
            projectId={boardProjectFilter}
            teamMembers={teamMembers}
            projects={projects}
            matchCount={visibleTasks.length}
            totalCount={tasks.length}
            isFiltering={isFiltering}
            onSearchChange={setSearch}
            onAssigneeChange={setFilterAssignee}
            onPriorityChange={(value) => setFilterPriority(value as "" | Priority)}
            onProjectChange={setBoardProjectFilter}
            onClear={clearFilters}
          />
          {tasks.length === 0 ? (
            <EmptyBoardState onAddTask={openAddModal} />
          ) : (
            <TaskBoard
              columns={columns}
              teamMembers={teamMembers}
              projects={projects}
              tasks={visibleTasks}
              isFiltering={isFiltering}
              draggingId={draggingId}
              dragOverColumn={dragOverColumn}
              onOpenTask={setViewingId}
              onToggleStage={toggleStage}
              onCardDragStart={handleDragStart}
              onCardDragEnd={handleDragEnd}
              onColumnDragOver={handleColumnDragOver}
              onColumnDragLeave={handleColumnDragLeave}
              onColumnDrop={handleDrop}
            />
          )}
        </>
      )}
      <TaskFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editingId)}
        formData={formData}
        invalidFields={invalidFields}
        teamMembers={teamMembers}
        projects={projects}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        onFieldChange={setFormValue}
        onToggleAssignee={toggleAssignee}
      />
      <ProjectFormModal
        isOpen={isProjectFormOpen}
        isEditing={Boolean(editingProjectId)}
        formData={projectFormData}
        isInvalid={isProjectFormInvalid}
        onClose={closeProjectFormModal}
        onSubmit={handleProjectFormSubmit}
        onFieldChange={setProjectFormValue}
      />
      <ProjectDetailModal
        project={viewingProject}
        supabase={supabase}
        workspaceId={workspace.id}
        taskCount={viewingProject ? (projectTaskCounts[viewingProject.id] ?? 0) : 0}
        resourceTotal={viewingProject ? (resourceTotals[viewingProject.id] ?? 0) : 0}
        onClose={() => setViewingProjectId(null)}
        onEdit={openEditProjectModal}
        onDelete={setPendingDeleteProjectId}
        onDuplicated={(newProject) => {
          setProjects((current) => [...current, newProject]);
          logActivity("project", `duplicated a project as "${newProject.name}"`);
        }}
        onViewBoard={viewProjectBoard}
      />
      <ResourceFormModal
        isOpen={isResourceFormOpen}
        isEditing={Boolean(editingResourceId)}
        formData={resourceFormData}
        isInvalid={isResourceFormInvalid}
        teamMembers={teamMembers}
        onClose={closeResourceFormModal}
        onSubmit={handleResourceFormSubmit}
        onFieldChange={setResourceFormValue}
      />
      <TaskDetailModal
        task={viewingTask}
        columns={columns}
        teamMembers={teamMembers}
        projects={projects}
        isUploadingAttachment={isUploadingAttachment}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={setPendingDeleteId}
        onDuplicate={duplicateTask}
        onToggleStage={toggleStage}
        onMoveColumn={moveTaskToColumn}
        onChangeProject={changeTaskProject}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onAssignSubtask={assignSubtask}
        onDeleteSubtask={deleteSubtask}
        onUploadAttachment={uploadAttachment}
        onDownloadAttachment={downloadAttachment}
        onDeleteAttachment={deleteAttachment}
      />
      <ConfirmDeleteModal
        task={pendingDeleteTask}
        onCancel={closeConfirmModal}
        onConfirm={confirmDelete}
      />
      <ConfirmActionModal
        isOpen={Boolean(pendingDeleteProjectId)}
        title="Delete Project?"
        message={`"${pendingDeleteProjectName}" and its features, requirements, and resources will be permanently deleted. Its tasks will stay on the board, unassigned from any project.`}
        onCancel={() => setPendingDeleteProjectId(null)}
        onConfirm={confirmDeleteProject}
      />
      <ConfirmActionModal
        isOpen={Boolean(pendingDeleteResourceId)}
        title="Delete Subscription?"
        message={`"${pendingDeleteResourceName}" will be permanently removed from your subscriptions list.`}
        onCancel={() => setPendingDeleteResourceId(null)}
        onConfirm={confirmDeleteResource}
      />
      <ImportConfirmModal
        fileName={pendingImport?.fileName ?? null}
        importCount={pendingImport?.tasks.length ?? 0}
        currentCount={tasks.length}
        onCancel={cancelImport}
        onConfirm={confirmImport}
      />
      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        columns={columns}
        columnCounts={columnCounts}
        onClose={() => setIsColumnSettingsOpen(false)}
        onRename={renameColumn}
        onToggleComplete={toggleColumnComplete}
        onMove={moveColumn}
        onDelete={deleteColumn}
        onAdd={addColumn}
      />
      <TeamSettingsModal
        isOpen={isTeamSettingsOpen}
        members={members}
        memberCounts={teamMemberCounts}
        isOwner={isOwner}
        onClose={() => setIsTeamSettingsOpen(false)}
        onRemove={removeMember}
        onInvite={inviteMember}
      />
      <WorkspaceSettingsModal
        isOpen={isWorkspaceSettingsOpen}
        name={workspaceName}
        isOwner={isOwner}
        onClose={() => setIsWorkspaceSettingsOpen(false)}
        onSave={renameWorkspace}
      />
      <UndoToast taskName={lastDeleted?.task.name ?? null} onUndo={undoDelete} />
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onSkip={skipWelcome}
        onStartTour={startTourFromWelcome}
      />
      <ProductTour isActive={isTourActive} onFinish={finishTour} />
    </main>
  );
}
