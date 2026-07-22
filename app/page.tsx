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
import { ProjectBoard } from "../components/ProjectBoard";
import { ProjectDetailModal } from "../components/ProjectDetailModal";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { SummaryBar } from "../components/SummaryBar";
import { UndoToast } from "../components/UndoToast";
import {
  COLUMNS_STORAGE_KEY,
  DEFAULT_COLUMNS,
  PROJECT_STORAGE_KEY,
  createEmptyForm,
  createSeedProject,
  generateId,
  getMissingFields,
  isColumnComplete,
  isDueSoon,
  isOverdue,
  normalizeColumns,
  normalizeProject,
  syncStagesWithColumn,
  type BoardColumnDef,
  type Column,
  type InvalidField,
  type Priority,
  type Project,
  type ProjectFormState,
  type TeamMember,
} from "../lib/projects";

const UNDO_WINDOW_MS = 6000;

export default function AgencyBoardPage() {
  const [columns, setColumns] = useState<BoardColumnDef[]>(DEFAULT_COLUMNS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Column | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormState>(() => createEmptyForm());
  const [invalidFields, setInvalidFields] = useState<Set<InvalidField>>(() => new Set());
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState<"" | Priority>("");
  const [lastDeleted, setLastDeleted] = useState<{ project: Project; index: number } | null>(null);
  const [pendingImport, setPendingImport] = useState<{ fileName: string; projects: Project[] } | null>(
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

    try {
      const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        const nextProjects = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeProject(item, loadedColumns))
              .filter((project): project is Project => Boolean(project))
          : [];

        setProjects(nextProjects);
      } else {
        setProjects([createSeedProject(loadedColumns)]);
      }
    } catch (error) {
      console.warn("localStorage read failed:", error);
      setProjects([createSeedProject(loadedColumns)]);
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
      window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  }, [projects, storageReady]);

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

      if (event.key !== PROJECT_STORAGE_KEY) return;

      if (event.newValue === null) {
        setProjects([]);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        const nextProjects = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeProject(item, columns))
              .filter((project): project is Project => Boolean(project))
          : [];

        setProjects(nextProjects);
      } catch (error) {
        console.warn("cross-tab sync parse failed:", error);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [columns]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (pendingImport) {
        setPendingImport(null);
      } else if (pendingDeleteId) {
        setPendingDeleteId(null);
      } else if (isColumnSettingsOpen) {
        setIsColumnSettingsOpen(false);
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
  }, [pendingImport, pendingDeleteId, isColumnSettingsOpen, isFormOpen, viewingId]);

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
      total: projects.length,
      overdue: projects.filter((project) => isOverdue(project, columns)).length,
      dueSoon: projects.filter((project) => isDueSoon(project, columns)).length,
      completed: projects.filter((project) => isColumnComplete(columns, project.column)).length,
    }),
    [projects, columns],
  );

  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      counts[project.column] = (counts[project.column] ?? 0) + 1;
    });
    return counts;
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      if (filterAssignee && !project.assignees.includes(filterAssignee as TeamMember)) return false;
      if (filterPriority && project.priority !== filterPriority) return false;
      if (!query) return true;

      return (
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.desc.toLowerCase().includes(query)
      );
    });
  }, [projects, search, filterAssignee, filterPriority]);

  const isFiltering = Boolean(search.trim() || filterAssignee || filterPriority);

  function clearFilters() {
    setSearch("");
    setFilterAssignee("");
    setFilterPriority("");
  }

  const viewingProject = viewingId
    ? projects.find((project) => project.id === viewingId) ?? null
    : null;
  const pendingDeleteProject = pendingDeleteId
    ? projects.find((project) => project.id === pendingDeleteId) ?? null
    : null;

  function setFormValue(
    key: "name" | "client" | "desc" | "deadline" | "priority",
    value: string,
  ) {
    setFormData((current) => ({ ...current, [key]: value }) as ProjectFormState);
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
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    setEditingId(id);
    setFormData({
      name: project.name,
      client: project.client,
      desc: project.desc,
      deadline: project.deadline,
      priority: project.priority,
      assignees: project.assignees,
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

    const cleanProjectFields = {
      name: formData.name.trim(),
      client: formData.client.trim(),
      desc: formData.desc.trim(),
      deadline: formData.deadline,
      priority: formData.priority as Priority,
      assignees: formData.assignees,
    };

    if (editingId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingId ? { ...project, ...cleanProjectFields } : project,
        ),
      );
    } else {
      const initialStages: Record<string, boolean> = {};
      columns.forEach((column) => {
        initialStages[column.id] = false;
      });

      setProjects((current) => [
        ...current,
        {
          id: generateId(),
          ...cleanProjectFields,
          column: columns[0]?.id ?? "",
          stages: initialStages,
          tasks: [],
          createdAt: Date.now(),
        },
      ]);
    }

    closeFormModal();
    closeDetailModal();
  }

  const toggleStage = useCallback((projectId: string, columnId: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, stages: { ...project.stages, [columnId]: !project.stages[columnId] } }
          : project,
      ),
    );
  }, []);

  const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>, projectId: string) => {
    setDraggingId(projectId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", projectId);
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

  const moveProjectToColumn = useCallback(
    (projectId: string, targetColumn: Column) => {
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId && project.column !== targetColumn
            ? {
                ...project,
                column: targetColumn,
                stages: syncStagesWithColumn(project.stages, columns, targetColumn),
              }
            : project,
        ),
      );
    },
    [columns],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetColumn: Column) => {
      event.preventDefault();
      const projectId = draggingId ?? event.dataTransfer.getData("text/plain");

      setDragOverColumn(null);
      setDraggingId(null);

      if (!projectId) return;

      moveProjectToColumn(projectId, targetColumn);
    },
    [draggingId, moveProjectToColumn],
  );

  function handleEditFromDetail(projectId: string) {
    closeDetailModal();
    openEditModal(projectId);
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;

    const projectId = pendingDeleteId;
    const index = projects.findIndex((project) => project.id === projectId);
    const project = index >= 0 ? projects[index] : null;

    setProjects((current) => current.filter((item) => item.id !== projectId));
    setPendingDeleteId(null);

    if (viewingId === projectId) {
      setViewingId(null);
    }

    if (project) {
      setLastDeleted({ project, index });
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

    const { project, index } = lastDeleted;
    setLastDeleted(null);
    setProjects((current) => {
      if (current.some((item) => item.id === project.id)) return current;

      const next = [...current];
      next.splice(Math.min(index, next.length), 0, project);
      return next;
    });
  }

  function addTask(projectId: string, title: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                { id: generateId("task"), title, done: false, assignee: "" },
              ],
            }
          : project,
      ),
    );
  }

  function toggleTask(projectId: string, taskId: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            }
          : project,
      ),
    );
  }

  function assignTask(projectId: string, taskId: string, assignee: "" | TeamMember) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, assignee } : task,
              ),
            }
          : project,
      ),
    );
  }

  function deleteTask(projectId: string, taskId: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, tasks: project.tasks.filter((task) => task.id !== taskId) }
          : project,
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

  function handleExport() {
    const payload = JSON.stringify(projects, null, 2);
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
        const nextProjects = Array.isArray(parsed)
          ? parsed
              .map((item) => normalizeProject(item, columns))
              .filter((project): project is Project => Boolean(project))
          : [];

        if (nextProjects.length === 0) {
          window.alert("No valid projects were found in that file.");
          return;
        }

        setPendingImport({ fileName: file.name, projects: nextProjects });
      } catch (error) {
        console.warn("import parse failed:", error);
        window.alert("That file isn't valid JSON.");
      }
    };

    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pendingImport) return;

    setProjects(pendingImport.projects);
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
      />
      <SummaryBar stats={stats} onAddProject={openAddModal} />
      <FilterBar
        search={search}
        assignee={filterAssignee}
        priority={filterPriority}
        matchCount={visibleProjects.length}
        totalCount={projects.length}
        isFiltering={isFiltering}
        onSearchChange={setSearch}
        onAssigneeChange={setFilterAssignee}
        onPriorityChange={(value) => setFilterPriority(value as "" | Priority)}
        onClear={clearFilters}
      />
      <ProjectBoard
        columns={columns}
        projects={visibleProjects}
        draggingId={draggingId}
        dragOverColumn={dragOverColumn}
        onOpenProject={setViewingId}
        onToggleStage={toggleStage}
        onCardDragStart={handleDragStart}
        onCardDragEnd={handleDragEnd}
        onColumnDragOver={handleColumnDragOver}
        onColumnDragLeave={handleColumnDragLeave}
        onColumnDrop={handleDrop}
      />
      <ProjectFormModal
        isOpen={isFormOpen}
        isEditing={Boolean(editingId)}
        formData={formData}
        invalidFields={invalidFields}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        onFieldChange={setFormValue}
        onToggleAssignee={toggleAssignee}
      />
      <ProjectDetailModal
        project={viewingProject}
        columns={columns}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={setPendingDeleteId}
        onToggleStage={toggleStage}
        onMoveColumn={moveProjectToColumn}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onAssignTask={assignTask}
        onDeleteTask={deleteTask}
      />
      <ConfirmDeleteModal
        project={pendingDeleteProject}
        onCancel={closeConfirmModal}
        onConfirm={confirmDelete}
      />
      <ImportConfirmModal
        fileName={pendingImport?.fileName ?? null}
        importCount={pendingImport?.projects.length ?? 0}
        currentCount={projects.length}
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
      <UndoToast projectName={lastDeleted?.project.name ?? null} onUndo={undoDelete} />
    </main>
  );
}
