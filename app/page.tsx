"use client";

import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { AppHeader } from "../components/AppHeader";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { ProjectBoard } from "../components/ProjectBoard";
import { ProjectDetailModal } from "../components/ProjectDetailModal";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { SummaryBar } from "../components/SummaryBar";
import {
  COLUMNS,
  PROJECT_STORAGE_KEY,
  REQUIRED_FIELDS,
  TEAM_MEMBERS,
  createEmptyForm,
  createSeedProject,
  generateId,
  isOverdue,
  normalizeProject,
  type Column,
  type InvalidField,
  type Priority,
  type Project,
  type ProjectFormState,
  type TeamMember,
} from "../lib/projects";

export default function AgencyBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Column | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormState>(() => createEmptyForm());
  const [invalidFields, setInvalidFields] = useState<Set<InvalidField>>(() => new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        const nextProjects = Array.isArray(parsed)
          ? parsed.map(normalizeProject).filter((project): project is Project => Boolean(project))
          : [];

        setProjects(nextProjects);
      } else {
        setProjects([createSeedProject()]);
      }
    } catch (error) {
      console.warn("localStorage read failed:", error);
      setProjects([createSeedProject()]);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  }, [projects, storageReady]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setIsFormOpen(false);
      setEditingId(null);
      setFormData(createEmptyForm());
      setInvalidFields(new Set());
      setViewingId(null);
      setPendingDeleteId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const stats = useMemo(
    () => ({
      total: projects.length,
      overdue: projects.filter(isOverdue).length,
      live: projects.filter((project) => project.column === "Live").length,
    }),
    [projects],
  );

  const viewingProject = viewingId
    ? projects.find((project) => project.id === viewingId) ?? null
    : null;
  const pendingDeleteProject = pendingDeleteId
    ? projects.find((project) => project.id === pendingDeleteId) ?? null
    : null;

  function setFormValue(key: keyof ProjectFormState, value: string) {
    setFormData((current) => ({ ...current, [key]: value }) as ProjectFormState);
    setInvalidFields((current) => {
      if (!current.has(key)) return current;

      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function openAddModal() {
    setEditingId(null);
    setFormData(createEmptyForm());
    setInvalidFields(new Set());
    setIsFormOpen(true);
  }

  function openEditModal(id: string | null) {
    if (!id) return;

    const project = projects.find((item) => item.id === id);
    if (!project) return;

    setEditingId(id);
    setFormData({
      name: project.name,
      client: project.client,
      desc: project.desc,
      deadline: project.deadline,
      priority: project.priority,
      assignee: TEAM_MEMBERS.includes(project.assignee as TeamMember)
        ? (project.assignee as TeamMember)
        : "",
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

    const missingFields = REQUIRED_FIELDS.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      setInvalidFields(new Set(missingFields));
      window.setTimeout(() => setInvalidFields(new Set()), 2000);
      return;
    }

    const cleanProjectFields = {
      name: formData.name.trim(),
      client: formData.client.trim(),
      desc: formData.desc.trim(),
      deadline: formData.deadline,
      priority: formData.priority as Priority,
      assignee: formData.assignee as TeamMember,
    };

    if (editingId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === editingId ? { ...project, ...cleanProjectFields } : project,
        ),
      );
    } else {
      setProjects((current) => [
        ...current,
        {
          id: generateId(),
          ...cleanProjectFields,
          column: "Initiate",
          stages: Array(COLUMNS.length).fill(false),
          createdAt: Date.now(),
        },
      ]);
    }

    closeFormModal();
    closeDetailModal();
  }

  function toggleStage(projectId: string, stageIndex: number) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              stages: project.stages.map((stage, index) =>
                index === stageIndex ? !stage : stage,
              ),
            }
          : project,
      ),
    );
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, projectId: string) {
    setDraggingId(projectId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", projectId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverColumn(null);
  }

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>, column: Column) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(column);
  }

  function handleColumnDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setDragOverColumn(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetColumn: Column) {
    event.preventDefault();
    const projectId = draggingId ?? event.dataTransfer.getData("text/plain");

    setDragOverColumn(null);
    setDraggingId(null);

    if (!projectId) return;

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId && project.column !== targetColumn
          ? { ...project, column: targetColumn }
          : project,
      ),
    );
  }

  function handleEditFromDetail(projectId: string) {
    closeDetailModal();
    openEditModal(projectId);
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;

    const projectId = pendingDeleteId;
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setPendingDeleteId(null);

    if (viewingId === projectId) {
      setViewingId(null);
    }
  }

  return (
    <main className="app-shell">
      <AppHeader />
      <SummaryBar stats={stats} onAddProject={openAddModal} />
      <ProjectBoard
        projects={projects}
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
      />
      <ProjectDetailModal
        project={viewingProject}
        onClose={closeDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={setPendingDeleteId}
        onToggleStage={toggleStage}
      />
      <ConfirmDeleteModal
        project={pendingDeleteProject}
        onCancel={closeConfirmModal}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
