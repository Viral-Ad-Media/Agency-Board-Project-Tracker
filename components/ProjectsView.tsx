import { Plus } from "lucide-react";
import { formatDate, projectStatusLabel, type Project } from "../lib/tasks";

type ProjectsViewProps = {
  projects: Project[];
  taskCounts: Record<string, number>;
  resourceTotals: Record<string, number>;
  onAddProject: () => void;
  onOpenProject: (project: Project) => void;
};

export function ProjectsView({
  projects,
  taskCounts,
  resourceTotals,
  onAddProject,
  onOpenProject,
}: ProjectsViewProps) {
  return (
    <section className="projects-view" aria-label="Projects">
      <div className="projects-view-header">
        <div>
          <h2 className="projects-view-title">Projects</h2>
          <p className="projects-view-subtitle">
            Group tasks under a project with its own timeline, requirements, and costed
            resources.
          </p>
        </div>
        <button className="btn-primary projects-new-btn" type="button" onClick={onAddProject}>
          <Plus size={14} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>No projects yet.</p>
          <button className="btn-primary" type="button" onClick={onAddProject}>
            <Plus size={14} />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <button
              className="project-card"
              type="button"
              key={project.id}
              onClick={() => onOpenProject(project)}
            >
              <div className="project-card-header">
                <span className="project-card-name">{project.name}</span>
                <span className={`project-status-badge status-${project.status}`}>
                  {projectStatusLabel(project.status)}
                </span>
              </div>
              {project.client ? <div className="project-card-client">{project.client}</div> : null}
              <div className="project-card-meta">
                <span>{formatDate(project.startDate)} &rarr; {formatDate(project.targetDate)}</span>
              </div>
              <div className="project-card-stats">
                <span>{taskCounts[project.id] ?? 0} tasks</span>
                <span>${(resourceTotals[project.id] ?? 0).toLocaleString()} resources</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
