"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { AppHeader } from "../components/AppHeader";
import { ColumnSettingsModal } from "../components/ColumnSettingsModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { FilterBar } from "../components/FilterBar";
import { ImportConfirmModal } from "../components/ImportConfirmModal";
import { SummaryBar } from "../components/SummaryBar";
import { TaskBoard } from "../components/TaskBoard";
import { TaskDetailModal } from "../components/TaskDetailModal";
import { TaskFormModal } from "../components/TaskFormModal";
import { TeamSettingsModal } from "../components/TeamSettingsModal";
import { UndoToast } from "../components/UndoToast";
import {
  COLUMNS_STORAGE_KEY,
  DEFAULT_COLUMNS,
  DEFAULT_TEAM_MEMBERS,
  TASK_STORAGE_KEY,
  TEAM_MEMBERS_STORAGE_KEY,
  createEmptyForm,
  createSeedTask,
  generateId,
  getMissingFields,
  isColumnComplete,
  isDueSoon,
  isOverdue,
  normalizeColumns,
  normalizeTask,
  normalizeTeamMembers,
  syncStagesWithColumn,
  type BoardColumnDef,
  type Column,
  type InvalidField,
  type Priority,
  type Task,
  type TaskFormState,
  type TeamMember,
  type TeamMemberDef,
} from "../lib/tasks";

const UNDO_WINDOW_MS = 6000;

export default function AgencyBoardPage() {
  const [columns, setColumns] = useState<BoardColumnDef[]>(DEFAULT_COLUMNS);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDef[]>(DEFAULT_TEAM_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Column | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormState>(() => createEmptyForm());
  const [invalidFields, setInvalidFields] = useState<Set<InvalidField>>(() => new Set());
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState<"" | Priority>("");
  const [lastDeleted, setLastDeleted] = useState<{ task: Task; index: number } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; tasks: Task[] } | null>(
    null,
  );
  const invalidTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let loadedColumns = DEFAULT_COLUMNS;

    try {
      const rawColumns = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
      loadedColumns = rawColumns ? normalizeColumns(JSON.parse(rawColumns)) : DEFAULT_COLUMNS;
    } catch (error) {
      console.warn("columns localStorage read failed:", error);
    }

    setColumns(loadedColumns);

    let loadedTeamMembers = DEFAULT_TEAM_MEMBERS;

    try {
      const rawTeamMembers = window.localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);
      loadedTeamMembers = rawTeamMembers
        ? normalizeTeamMembers(JSON.parse(rawTeamMembers))
        : DEFAULT_TEAM_MEMBERS;
    } catch (error) {
      console.warn("team members localStorage read failed:", error);
    }

    setTeamMembers(loadedTeamMembers);

    try {
      const raw = window.localStorage.getItem(TASK_STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        const nextTasks = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeTask(item, loadedColumns, loadedTeamMembers))
              .filter((task): task is Task => Boolean(task))
          : [];

        setTasks(nextTasks);
      } else {
        setTasks([createSeedTask(loadedColumns, loadedTeamMembers)]);
      }
    } catch (error) {
      console.warn("localStorage read failed:", error);
      setTasks([createSeedTask(loadedColumns, loadedTeamMembers)]);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    try {
      window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.warn("columns localStorage write failed:", error);
    }
  }, [columns, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    try {
      window.localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(teamMembers));
    } catch (error) {
      console.warn("team members localStorage write failed:", error);
    }
  }, [teamMembers, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    try {
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  }, [tasks, storageReady]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === COLUMNS_STORAGE_KEY) {
        if (event.newValue === null) {
          setColumns(DEFAULT_COLUMNS);
          return;
        }

        try {
          setColumns(normalizeColumns(JSON.parse(event.newValue)));
        } catch (error) {
          console.warn("cross-tab column sync parse failed:", error);
        }
        return;
      }

      if (event.key === TEAM_MEMBERS_STORAGE_KEY) {
        if (event.newValue === null) {
          setTeamMembers(DEFAULT_TEAM_MEMBERS);
          return;
        }

        try {
          setTeamMembers(normalizeTeamMembers(JSON.parse(event.newValue)));
        } catch (error) {
          console.warn("cross-tab team sync parse failed:", error);
        }
        return;
      }

      if (event.key !== TASK_STORAGE_KEY) return;

      if (event.newValue === null) {
        setTasks([]);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        const nextTasks = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeTask(item, columns, teamMembers))
              .filter((task): task is Task => Boolean(task))
          : [];

        setTasks(nextTasks);
      } catch (error) {
        console.warn("cross-tab sync parse failed:", error);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [columns, teamMembers]);

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
      } else if (isFormOpen) {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData(createEmptyForm());
        setInvalidFields(new Set());
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
    isFormOpen,
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
      if (filterAssignee && !task.assignees.includes(filterAssignee)) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (!query) return true;

      return (
        task.name.toLowerCase().includes(query) ||
        task.client.toLowerCase().includes(query) ||
        task.desc.toLowerCase().includes(query)
      );
    });
  }, [tasks, search, filterAssignee, filterPriority]);

  const isFiltering = Boolean(search.trim() || filterAssignee || filterPriority);

  function clearFilters() {
    setSearch("");
    setFilterAssignee("");
    setFilterPriority("");
  }

  const viewingTask = viewingId ? tasks.find((task) => task.id === viewingId) ?? null : null;
  const pendingDeleteTask = pendingDeleteId
    ? tasks.find((task) => task.id === pendingDeleteId) ?? null
    : null;

  function setFormValue(key: "name" | "client" | "desc" | "deadline" | "priority", value: string) {
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

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
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
    };

    if (editingId) {
      setTasks((current) =>
        current.map((task) => (task.id === editingId ? { ...task, ...cleanTaskFields } : task)),
      );
    } else {
      const initialStages: Record<string, boolean> = {};
      columns.forEach((column) => {
        initialStages[column.id] = false;
      });

      setTasks((current) => [
        ...current,
        {
          id: generateId(),
          ...cleanTaskFields,
          column: columns[0]?.id ?? "",
          stages: initialStages,
          subtasks: [],
          createdAt: Date.now(),
        },
      ]);
    }

    closeFormModal();
    closeDetailModal();
  }

  const toggleStage = useCallback((taskId: string, columnId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, stages: { ...task.stages, [columnId]: !task.stages[columnId] } }
          : task,
      ),
    );
  }, []);

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
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId && task.column !== targetColumn
            ? {
                ...task,
                column: targetColumn,
                stages: syncStagesWithColumn(task.stages, columns, targetColumn),
              }
            : task,
        ),
      );
    },
    [columns],
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
    }
  }

  function undoDelete() {
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
  }

  function addSubtask(taskId: string, title: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { id: generateId("subtask"), title, done: false, assignee: "" },
              ],
            }
          : task,
      ),
    );
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
              ),
            }
          : task,
      ),
    );
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
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId) }
          : task,
      ),
    );
  }

  function renameColumn(columnId: string, name: string) {
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, name } : column)),
    );
  }

  function toggleColumnComplete(columnId: string, countsAsComplete: boolean) {
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, countsAsComplete } : column)),
    );
  }

  function moveColumn(columnId: string, direction: "up" | "down") {
    setColumns((current) => {
      const index = current.findIndex((column) => column.id === columnId);
      if (index === -1) return current;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function deleteColumn(columnId: string) {
    const hasCards = (columnCounts[columnId] ?? 0) > 0;
    if (hasCards || columns.length <= 1) return;

    setColumns((current) => current.filter((column) => column.id !== columnId));
  }

  function addColumn(name: string) {
    setColumns((current) => [...current, { id: generateId("col"), name, countsAsComplete: false }]);
  }

  function deleteTeamMember(memberId: string) {
    const isInUse = (teamMemberCounts[memberId] ?? 0) > 0;
    if (isInUse || teamMembers.length <= 1) return;

    setTeamMembers((current) => current.filter((member) => member.id !== memberId));
  }

  function addTeamMember(name: string) {
    setTeamMembers((current) => [...current, { id: generateId("member"), name }]);
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
              .map((item) => normalizeTask(item, columns, teamMembers))
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

  function confirmImport() {
    if (!pendingImport) return;

    setTasks(pendingImport.tasks);
    setPendingImport(null);
    clearFilters();
  }

  function cancelImport() {
    setPendingImport(null);
  }

  return (
    <main className="app-shell">
      <AppHeader
        onExport={handleExport}
        onImportFile={handleImportFile}
        onManageColumns={() => setIsColumnSettingsOpen(true)}
        onManageTeam={() => setIsTeamSettingsOpen(true)}
      />
      <SummaryBar stats={stats} onAddTask={openAddModal} />
      <FilterBar
        search={search}
        assignee={filterAssignee}
        priority={filterPriority}
        teamMembers={teamMembers}
        matchCount={visibleTasks.length}
        totalCount={tasks.length}
        isFiltering={isFiltering}
        onSearchChange={setSearch}
        onAssigneeChange={setFilterAssignee}
        onPriorityChange={(value) => setFilterPriority(value as "" | Priority)}
        onClear={clearFilters}
      />
      <TaskBoard
        columns={columns}
        teamMembers={teamMembers}
        tasks={visibleTasks}
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
      <TaskFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editingId)}
        formData={formData}
        invalidFields={invalidFields}
        teamMembers={teamMembers}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        onFieldChange={setFormValue}
        onToggleAssignee={toggleAssignee}
      />
      <TaskDetailModal
        task={viewingTask}
        columns={columns}
        teamMembers={teamMembers}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={setPendingDeleteId}
        onToggleStage={toggleStage}
        onMoveColumn={moveTaskToColumn}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onAssignSubtask={assignSubtask}
        onDeleteSubtask={deleteSubtask}
      />
      <ConfirmDeleteModal
        task={pendingDeleteTask}
        onCancel={closeConfirmModal}
        onConfirm={confirmDelete}
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
        teamMembers={teamMembers}
        memberCounts={teamMemberCounts}
        onClose={() => setIsTeamSettingsOpen(false)}
        onDelete={deleteTeamMember}
        onAdd={addTeamMember}
      />
      <UndoToast taskName={lastDeleted?.task.name ?? null} onUndo={undoDelete} />
    </main>
  );
}
