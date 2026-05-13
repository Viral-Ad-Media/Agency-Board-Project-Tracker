"use client";

import {
  Calendar,
  Check,
  LayoutGrid,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

const COLUMNS = [
  "Initiate",
  "Briefing",
  "In Production",
  "Review",
  "Done",
  "Live",
] as const;

const STAGE_LABELS = [
  "Initiate",
  "Briefing",
  "Production",
  "Review",
  "Done",
  "Live",
] as const;

const PRIORITIES = ["High", "Medium", "Low"] as const;
const TEAM_MEMBERS = ["Wale", "Beejay", "Dami", "Mabel", "Laguda", "Mide"] as const;
const LS_KEY = "agencyBoard_v2";

type Column = (typeof COLUMNS)[number];
type Priority = (typeof PRIORITIES)[number];
type TeamMember = (typeof TEAM_MEMBERS)[number];

type Project = {
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

type ProjectFormState = {
  name: string;
  client: string;
  desc: string;
  deadline: string;
  priority: "" | Priority;
  assignee: "" | TeamMember;
};

type InvalidField = keyof ProjectFormState;

const AVATAR_COLORS: Record<TeamMember, string> = {
  Wale: "#5a5aff",
  Beejay: "#b05aff",
  Dami: "#ff6b2b",
  Mabel: "#00cc88",
  Laguda: "#ffaa00",
  Mide: "#00e5ff",
};

const REQUIRED_FIELDS: InvalidField[] = [
  "name",
  "client",
  "deadline",
  "priority",
  "assignee",
];

function createEmptyForm(): ProjectFormState {
  return {
    name: "",
    client: "",
    desc: "",
    deadline: "",
    priority: "",
    assignee: "",
  };
}

function generateId() {
  return `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isColumn(value: unknown): value is Column {
  return typeof value === "string" && COLUMNS.includes(value as Column);
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

function normalizeProject(value: unknown): Project | null {
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

function createSeedProject(): Project {
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

function formatDate(value: string) {
  if (!value) return "-";

  const [year, month, day] = value.split("-");
  const monthIndex = Number.parseInt(month, 10) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (!year || !day || Number.isNaN(monthIndex) || !months[monthIndex]) return value;
  return `${day} ${months[monthIndex]} ${year}`;
}

function isOverdue(project: Project) {
  if (!project.deadline || project.column === "Done" || project.column === "Live") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${project.deadline}T00:00:00`) < today;
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase() || "--";
}

function countCompleteStages(project: Project) {
  return project.stages.filter(Boolean).length;
}

function priorityClass(priority: Priority) {
  return priority.toLowerCase();
}

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
      const raw = window.localStorage.getItem(LS_KEY);

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
      window.localStorage.setItem(LS_KEY, JSON.stringify(projects));
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

  function setFormValue<Key extends keyof ProjectFormState>(
    key: Key,
    value: ProjectFormState[Key],
  ) {
    setFormData((current) => ({ ...current, [key]: value }));
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
      assignee: formData.assignee,
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
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-mark" aria-hidden="true">
              <LayoutGrid size={16} strokeWidth={2.4} />
            </div>
            <span className="brand-name">Agency Board</span>
            <span className="brand-divider" />
            <span className="brand-sub">Project Tracker</span>
          </div>
        </div>
      </header>

      <section className="summary-bar" aria-label="Project summary">
        <SummaryStat tone="total" value={stats.total} label="Total Projects" />
        <SummaryStat tone="overdue" value={stats.overdue} label="Overdue" />
        <SummaryStat tone="live" value={stats.live} label="Live" />
        <div className="summary-spacer" />
        <button className="btn-add-project" type="button" onClick={openAddModal}>
          <Plus size={15} />
          Initiate Project
        </button>
      </section>

      <section className="board-wrapper" aria-label="Project board">
        <div className="board">
          {COLUMNS.map((column) => {
            const columnProjects = projects.filter((project) => project.column === column);

            return (
              <article className="column" data-col={column} key={column}>
                <div className="column-header">
                  <h2 className="column-title">{column}</h2>
                  <span className="column-count">{columnProjects.length}</span>
                </div>

                <div
                  className={`column-cards${dragOverColumn === column ? " drag-over" : ""}`}
                  data-col={column}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverColumn(column);
                  }}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget as Node | null;
                    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                      setDragOverColumn(null);
                    }
                  }}
                  onDrop={(event) => handleDrop(event, column)}
                >
                  {columnProjects.length === 0 ? (
                    <div className="column-empty">Drop cards here</div>
                  ) : (
                    columnProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isDragging={draggingId === project.id}
                        onOpenDetail={setViewingId}
                        onToggleStage={toggleStage}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div
        className={`modal-overlay${isFormOpen ? " active" : ""}`}
        aria-hidden={!isFormOpen}
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeFormModal();
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">
                {editingId ? "Edit Project" : "Initiate Project"}
              </h2>
              <p className="modal-subtitle">
                {editingId
                  ? "Update the project details below."
                  : "Fill in the details to create a new project card."}
              </p>
            </div>
            <button
              className="modal-close"
              type="button"
              onClick={closeFormModal}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <form className="form-grid" onSubmit={handleFormSubmit} noValidate>
            <label className="form-field">
              <span className="form-label">Project Name</span>
              <input
                className={`form-input${invalidFields.has("name") ? " invalid" : ""}`}
                type="text"
                placeholder="e.g. Brand Refresh Campaign"
                value={formData.name}
                onChange={(event) => setFormValue("name", event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Client Name</span>
              <input
                className={`form-input${invalidFields.has("client") ? " invalid" : ""}`}
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.client}
                onChange={(event) => setFormValue("client", event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Description</span>
              <textarea
                className="form-textarea"
                placeholder="Brief project description..."
                value={formData.desc}
                onChange={(event) => setFormValue("desc", event.target.value)}
              />
            </label>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Deadline</span>
                <input
                  className={`form-input${invalidFields.has("deadline") ? " invalid" : ""}`}
                  type="date"
                  value={formData.deadline}
                  onChange={(event) => setFormValue("deadline", event.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Priority</span>
                <select
                  className={`form-select${invalidFields.has("priority") ? " invalid" : ""}`}
                  value={formData.priority}
                  onChange={(event) =>
                    setFormValue("priority", event.target.value as ProjectFormState["priority"])
                  }
                  required
                >
                  <option value="">Select...</option>
                  {PRIORITIES.map((priority) => (
                    <option value={priority} key={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Assigned To</span>
              <select
                className={`form-select${invalidFields.has("assignee") ? " invalid" : ""}`}
                value={formData.assignee}
                onChange={(event) =>
                  setFormValue("assignee", event.target.value as ProjectFormState["assignee"])
                }
                required
              >
                <option value="">Select team member...</option>
                {TEAM_MEMBERS.map((member) => (
                  <option value={member} key={member}>
                    {member}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeFormModal}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`modal-overlay${viewingProject ? " active" : ""}`}
        aria-hidden={!viewingProject}
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDetailModal();
        }}
      >
        {viewingProject ? (
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{viewingProject.name}</h2>
                <div className="detail-pill-row">
                  <span className={`priority-badge ${priorityClass(viewingProject.priority)}`}>
                    {viewingProject.priority}
                  </span>
                  <span className="col-badge">{viewingProject.column}</span>
                </div>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={closeDetailModal}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="detail-meta-grid">
              <DetailItem label="Client" value={viewingProject.client} />
              <DetailItem label="Assigned To" value={viewingProject.assignee} />
              <DetailItem label="Deadline" value={formatDate(viewingProject.deadline)} />
              <div className="detail-section">
                <div className="detail-section-label">Status</div>
                <div className="detail-section-value">
                  {isOverdue(viewingProject) ? (
                    <span className="status-text danger">Overdue</span>
                  ) : viewingProject.column === "Done" || viewingProject.column === "Live" ? (
                    <span className="status-text success">{viewingProject.column}</span>
                  ) : (
                    "On Track"
                  )}
                </div>
              </div>
            </div>

            <DetailItem
              label="Description"
              value={viewingProject.desc || "No description provided."}
            />

            <div className="detail-pipeline-section">
              <div className="detail-pipeline-title">Project Stages</div>
              <PipelineTrack
                project={viewingProject}
                isDetail
                onToggleStage={toggleStage}
              />
            </div>

            <div className="detail-actions">
              <button
                className="btn-danger"
                type="button"
                onClick={() => setPendingDeleteId(viewingProject.id)}
              >
                Delete
              </button>
              <div className="detail-actions-spacer" />
              <button className="btn-secondary" type="button" onClick={closeDetailModal}>
                Close
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  const projectId = viewingProject.id;
                  closeDetailModal();
                  openEditModal(projectId);
                }}
              >
                Edit Project
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`modal-overlay${pendingDeleteProject ? " active" : ""}`}
        aria-hidden={!pendingDeleteProject}
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeConfirmModal();
        }}
      >
        {pendingDeleteProject ? (
          <div className="modal confirm-modal">
            <div className="modal-header confirm-header">
              <div className="confirm-icon" aria-hidden="true">
                <Trash2 size={24} />
              </div>
              <h2 className="modal-title confirm-title">Delete Project?</h2>
              <p className="confirm-message">
                &quot;{pendingDeleteProject.name}&quot; will be permanently removed. This cannot
                be undone.
              </p>
            </div>
            <div className="form-actions confirm-actions">
              <button className="btn-secondary" type="button" onClick={closeConfirmModal}>
                Cancel
              </button>
              <button className="btn-danger" type="button" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function SummaryStat({
  tone,
  value,
  label,
}: {
  tone: "total" | "overdue" | "live";
  value: number;
  label: string;
}) {
  return (
    <div className={`summary-stat ${tone}`}>
      <span className="summary-stat-value">{value}</span>
      <span className="summary-stat-label">{label}</span>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-section">
      <div className="detail-section-label">{label}</div>
      <div className="detail-section-value">{value}</div>
    </div>
  );
}

function ProjectCard({
  project,
  isDragging,
  onOpenDetail,
  onToggleStage,
  onDragStart,
  onDragEnd,
}: {
  project: Project;
  isDragging: boolean;
  onOpenDetail: (projectId: string) => void;
  onToggleStage: (projectId: string, stageIndex: number) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, projectId: string) => void;
  onDragEnd: () => void;
}) {
  const overdue = isOverdue(project);
  const doneCount = countCompleteStages(project);
  const avatarColor = AVATAR_COLORS[project.assignee as TeamMember] ?? "#5a5aff";

  return (
    <div
      className={`card${overdue ? " overdue" : ""}${isDragging ? " dragging" : ""}`}
      data-id={project.id}
      draggable
      onDragStart={(event) => onDragStart(event, project.id)}
      onDragEnd={onDragEnd}
    >
      <button className="card-body" type="button" onClick={() => onOpenDetail(project.id)}>
        <span className="card-top">
          <span className="card-name">{project.name}</span>
          <span className={`priority-badge ${priorityClass(project.priority)}`}>
            {project.priority}
          </span>
        </span>

        <span className="card-client">
          Client: <span>{project.client}</span>
        </span>

        <span className="card-meta">
          <span className="card-assignee">
            <span className="assignee-avatar" style={{ background: avatarColor }}>
              {getInitials(project.assignee)}
            </span>
            <span>{project.assignee}</span>
          </span>
          <span className={`card-deadline${overdue ? " overdue-text" : ""}`}>
            <Calendar size={11} aria-hidden="true" />
            {formatDate(project.deadline)}
          </span>
        </span>

        {overdue ? (
          <span className="overdue-row">
            <span className="overdue-flag">OVERDUE</span>
          </span>
        ) : null}
      </button>

      <div className="pipeline-section">
        <div className="pipeline-summary">
          <strong>{doneCount}</strong> of {COLUMNS.length} stages complete
        </div>
        <PipelineTrack project={project} onToggleStage={onToggleStage} />
      </div>
    </div>
  );
}

function PipelineTrack({
  project,
  isDetail = false,
  onToggleStage,
}: {
  project: Project;
  isDetail?: boolean;
  onToggleStage: (projectId: string, stageIndex: number) => void;
}) {
  return (
    <div className={isDetail ? "detail-pipeline-track" : "pipeline-track"}>
      {COLUMNS.map((column, index) => {
        const complete = project.stages[index];
        const connectorComplete = complete && project.stages[index + 1];

        return (
          <Fragment key={column}>
            <button
              className={`stage-bubble${complete ? " complete" : ""}`}
              type="button"
              title={column}
              aria-pressed={complete}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStage(project.id, index);
              }}
            >
              <span className="stage-dot">
                <Check size={12} aria-hidden="true" />
              </span>
              <span className="stage-label">{STAGE_LABELS[index]}</span>
            </button>

            {index < COLUMNS.length - 1 ? (
              <span className={`pipeline-connector${connectorComplete ? " done" : ""}`} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
