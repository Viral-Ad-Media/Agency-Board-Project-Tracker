import type { SupabaseClient } from "@supabase/supabase-js";
import { Copy, LayoutGrid, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DetailItem } from "./DetailItem";
import { Modal } from "./Modal";
import { ProjectChecklist } from "./ProjectChecklist";
import { Tooltip } from "./Tooltip";
import {
  computeProjectCost,
  formatDate,
  generateId,
  projectStatusLabel,
  type Project,
} from "../lib/tasks";
import * as workspaceApi from "../lib/workspace";
import type { ProjectDetail } from "../lib/workspace";

type ProjectDetailModalProps = {
  project: Project | null;
  supabase: SupabaseClient;
  workspaceId: string;
  taskCount: number;
  resourceTotal: number;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onDuplicated: (project: Project) => void;
  onViewBoard: (projectId: string) => void;
};

export function ProjectDetailModal({
  project,
  supabase,
  workspaceId,
  taskCount,
  resourceTotal,
  onClose,
  onEdit,
  onDelete,
  onDuplicated,
  onViewBoard,
}: ProjectDetailModalProps) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceCost, setResourceCost] = useState("");
  const [resourceNotes, setResourceNotes] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    if (!project) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetail(null);

    workspaceApi
      .getProjectDetail(supabase, project.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((error) => {
        console.error(error);
        window.alert("Couldn't load project details. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [project, supabase]);

  if (!project) {
    return <Modal isOpen={false} onClose={onClose}>{null}</Modal>;
  }

  function reportError(error: unknown, message: string) {
    console.error(error);
    window.alert(message);
  }

  function addFeature(title: string) {
    if (!project) return;
    const id = generateId("feature");
    const position = detail?.features.length ?? 0;

    setDetail((current) =>
      current ? { ...current, features: [...current.features, { id, title, done: false }] } : current,
    );

    workspaceApi
      .addProjectFeature(supabase, workspaceId, project.id, id, title, position)
      .catch((error) => reportError(error, "Couldn't add that feature. Please try again."));
  }

  function toggleFeature(featureId: string) {
    let nextDone = false;
    setDetail((current) => {
      if (!current) return current;
      return {
        ...current,
        features: current.features.map((feature) => {
          if (feature.id !== featureId) return feature;
          nextDone = !feature.done;
          return { ...feature, done: nextDone };
        }),
      };
    });

    workspaceApi
      .toggleProjectFeature(supabase, featureId, nextDone)
      .catch((error) => reportError(error, "Couldn't save that change. Please try again."));
  }

  function deleteFeature(featureId: string) {
    setDetail((current) =>
      current ? { ...current, features: current.features.filter((f) => f.id !== featureId) } : current,
    );

    workspaceApi
      .deleteProjectFeature(supabase, featureId)
      .catch((error) => reportError(error, "Couldn't delete that feature. Please try again."));
  }

  function addRequirement(title: string) {
    if (!project) return;
    const id = generateId("requirement");
    const position = detail?.requirements.length ?? 0;

    setDetail((current) =>
      current
        ? { ...current, requirements: [...current.requirements, { id, title, done: false }] }
        : current,
    );

    workspaceApi
      .addProjectRequirement(supabase, workspaceId, project.id, id, title, position)
      .catch((error) => reportError(error, "Couldn't add that requirement. Please try again."));
  }

  function toggleRequirement(requirementId: string) {
    let nextDone = false;
    setDetail((current) => {
      if (!current) return current;
      return {
        ...current,
        requirements: current.requirements.map((requirement) => {
          if (requirement.id !== requirementId) return requirement;
          nextDone = !requirement.done;
          return { ...requirement, done: nextDone };
        }),
      };
    });

    workspaceApi
      .toggleProjectRequirement(supabase, requirementId, nextDone)
      .catch((error) => reportError(error, "Couldn't save that change. Please try again."));
  }

  function deleteRequirement(requirementId: string) {
    setDetail((current) =>
      current
        ? { ...current, requirements: current.requirements.filter((r) => r.id !== requirementId) }
        : current,
    );

    workspaceApi
      .deleteProjectRequirement(supabase, requirementId)
      .catch((error) => reportError(error, "Couldn't delete that requirement. Please try again."));
  }

  function handleAddResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;

    const name = resourceName.trim();
    const cost = Number.parseFloat(resourceCost) || 0;
    const notes = resourceNotes.trim();
    if (!name) return;

    const id = generateId("resource");
    const position = detail?.resources.length ?? 0;

    setDetail((current) =>
      current
        ? { ...current, resources: [...current.resources, { id, name, cost, notes }] }
        : current,
    );
    setResourceName("");
    setResourceCost("");
    setResourceNotes("");

    workspaceApi
      .addProjectResource(supabase, workspaceId, project.id, id, name, cost, notes, position)
      .catch((error) => reportError(error, "Couldn't add that resource. Please try again."));
  }

  function updateResource(resourceId: string, fields: { name: string; cost: number; notes: string }) {
    setDetail((current) =>
      current
        ? {
            ...current,
            resources: current.resources.map((resource) =>
              resource.id === resourceId ? { ...resource, ...fields } : resource,
            ),
          }
        : current,
    );

    workspaceApi
      .updateProjectResource(supabase, resourceId, fields)
      .catch((error) => reportError(error, "Couldn't save that change. Please try again."));
  }

  function deleteResource(resourceId: string) {
    setDetail((current) =>
      current ? { ...current, resources: current.resources.filter((r) => r.id !== resourceId) } : current,
    );

    workspaceApi
      .deleteProjectResource(supabase, resourceId)
      .catch((error) => reportError(error, "Couldn't delete that resource. Please try again."));
  }

  async function duplicateProject() {
    if (!project || isDuplicating) return;
    setIsDuplicating(true);

    const newProject: Project = {
      ...project,
      id: generateId("project"),
      name: `${project.name} (Copy)`,
      createdAt: Date.now(),
    };

    try {
      await workspaceApi.createProject(supabase, workspaceId, newProject);

      const features = detail?.features ?? [];
      for (let i = 0; i < features.length; i += 1) {
        await workspaceApi.addProjectFeature(
          supabase,
          workspaceId,
          newProject.id,
          generateId("feature"),
          features[i].title,
          i,
        );
      }

      const requirements = detail?.requirements ?? [];
      for (let i = 0; i < requirements.length; i += 1) {
        await workspaceApi.addProjectRequirement(
          supabase,
          workspaceId,
          newProject.id,
          generateId("requirement"),
          requirements[i].title,
          i,
        );
      }

      const resources = detail?.resources ?? [];
      for (let i = 0; i < resources.length; i += 1) {
        const resource = resources[i];
        await workspaceApi.addProjectResource(
          supabase,
          workspaceId,
          newProject.id,
          generateId("resource"),
          resource.name,
          resource.cost,
          resource.notes,
          i,
        );
      }

      onDuplicated(newProject);
      onClose();
    } catch (error) {
      reportError(error, "Couldn't duplicate that project. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  }

  const totalCost = detail ? computeProjectCost(detail.resources) : resourceTotal;

  return (
    <Modal isOpen={Boolean(project)} onClose={onClose}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{project.name}</h2>
            <div className="detail-pill-row">
              <span className={`project-status-badge status-${project.status}`}>
                {projectStatusLabel(project.status)}
              </span>
              {project.client ? <span className="detail-pill">{project.client}</span> : null}
            </div>
          </div>
          <Tooltip label="Close">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="detail-meta-grid">
          <DetailItem label="Start Date" value={formatDate(project.startDate)} />
          <DetailItem label="Target Date" value={formatDate(project.targetDate)} />
          <DetailItem label="Tasks" value={String(taskCount)} />
          <DetailItem label="Resource Cost" value={`$${totalCost.toLocaleString()}`} />
        </div>

        <DetailItem label="Description" value={project.description || "No description provided."} />

        <div className="detail-pipeline-section">
          <div className="detail-pipeline-title">Features</div>
          <ProjectChecklist
            items={detail?.features ?? []}
            emptyLabel="No features yet."
            addPlaceholder="Add a feature..."
            onAdd={addFeature}
            onToggle={toggleFeature}
            onDelete={deleteFeature}
          />
        </div>

        <div className="detail-pipeline-section">
          <div className="detail-pipeline-title">Requirements</div>
          <ProjectChecklist
            items={detail?.requirements ?? []}
            emptyLabel="No requirements yet."
            addPlaceholder="Add a requirement..."
            onAdd={addRequirement}
            onToggle={toggleRequirement}
            onDelete={deleteRequirement}
          />
        </div>

        <div className="detail-pipeline-section">
          <div className="detail-pipeline-title">Resources &amp; Cost</div>
          <div className="resource-list">
            {(detail?.resources.length ?? 0) > 0 ? (
              <>
                {detail!.resources.map((resource) => (
                  <div className="resource-row" key={resource.id}>
                    <input
                      className="form-input resource-name-input"
                      type="text"
                      defaultValue={resource.name}
                      onBlur={(event) =>
                        updateResource(resource.id, {
                          name: event.target.value.trim() || resource.name,
                          cost: resource.cost,
                          notes: resource.notes,
                        })
                      }
                      aria-label="Resource name"
                    />
                    <input
                      className="form-input resource-cost-input"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={resource.cost}
                      onBlur={(event) =>
                        updateResource(resource.id, {
                          name: resource.name,
                          cost: Number.parseFloat(event.target.value) || 0,
                          notes: resource.notes,
                        })
                      }
                      aria-label="Resource cost"
                    />
                    <input
                      className="form-input resource-notes-input"
                      type="text"
                      placeholder="Notes..."
                      defaultValue={resource.notes}
                      onBlur={(event) =>
                        updateResource(resource.id, {
                          name: resource.name,
                          cost: resource.cost,
                          notes: event.target.value,
                        })
                      }
                      aria-label="Resource notes"
                    />
                    <Tooltip label="Delete resource">
                      <button
                        className="icon-btn icon-btn-danger"
                        type="button"
                        onClick={() => deleteResource(resource.id)}
                        aria-label={`Delete resource "${resource.name}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </Tooltip>
                  </div>
                ))}
                <div className="resource-total-row">
                  <span>Total</span>
                  <span>${totalCost.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <p className="subtask-empty">No resources logged yet.</p>
            )}
          </div>

          <form className="resource-add-form" onSubmit={handleAddResource}>
            <input
              className="form-input resource-name-input"
              type="text"
              placeholder="Resource name..."
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
            />
            <input
              className="form-input resource-cost-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Cost"
              value={resourceCost}
              onChange={(event) => setResourceCost(event.target.value)}
            />
            <input
              className="form-input resource-notes-input"
              type="text"
              placeholder="Notes..."
              value={resourceNotes}
              onChange={(event) => setResourceNotes(event.target.value)}
            />
            <button className="btn-secondary subtask-add-btn" type="submit">
              <Plus size={14} />
              Add
            </button>
          </form>
        </div>

        <div className="detail-actions">
          <button className="btn-danger" type="button" onClick={() => onDelete(project.id)}>
            Delete
          </button>
          <Tooltip label="Duplicate this project's features, requirements & resources (not its tasks)">
            <button
              className="btn-secondary"
              type="button"
              onClick={duplicateProject}
              disabled={isDuplicating}
            >
              <Copy size={13} />
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </button>
          </Tooltip>
          <div className="detail-actions-spacer" />
          <button className="btn-secondary" type="button" onClick={() => onViewBoard(project.id)}>
            <LayoutGrid size={13} aria-hidden="true" />
            View Board
          </button>
          <button className="btn-primary" type="button" onClick={() => onEdit(project)}>
            Edit Project
          </button>
        </div>
      </div>
    </Modal>
  );
}
