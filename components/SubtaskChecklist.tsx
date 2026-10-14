import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Tooltip } from "./Tooltip";
import type { Subtask, TeamMember, TeamMemberDef } from "../lib/tasks";

type SubtaskChecklistProps = {
  subtasks: Subtask[];
  teamMembers: TeamMemberDef[];
  onAdd: (title: string) => void;
  onToggle: (subtaskId: string) => void;
  onAssign: (subtaskId: string, assignee: "" | TeamMember) => void;
  onDelete: (subtaskId: string) => void;
};

export function SubtaskChecklist({
  subtasks,
  teamMembers,
  onAdd,
  onToggle,
  onAssign,
  onDelete,
}: SubtaskChecklistProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    onAdd(trimmed);
    setNewSubtaskTitle("");
  }

  return (
    <div className="subtask-checklist">
      {subtasks.length > 0 ? (
        <ul className="subtask-list">
          {subtasks.map((subtask) => (
            <li className={`subtask-row${subtask.done ? " done" : ""}`} key={subtask.id}>
              <label className="subtask-checkbox">
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={() => onToggle(subtask.id)}
                  aria-label={`Mark "${subtask.title}" ${subtask.done ? "incomplete" : "complete"}`}
                />
                <span className="subtask-title">{subtask.title}</span>
              </label>

              <select
                className="subtask-assignee-select"
                value={subtask.assignee}
                onChange={(event) => onAssign(subtask.id, event.target.value as "" | TeamMember)}
                aria-label={`Assignee for "${subtask.title}"`}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>

              <Tooltip label="Delete subtask">
                <button
                  className="icon-btn icon-btn-danger"
                  type="button"
                  onClick={() => onDelete(subtask.id)}
                  aria-label={`Delete subtask "${subtask.title}"`}
                >
                  <X size={13} />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="subtask-empty">No subtasks yet.</p>
      )}

      <form className="subtask-add-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          type="text"
          placeholder="Add a subtask..."
          value={newSubtaskTitle}
          onChange={(event) => setNewSubtaskTitle(event.target.value)}
        />
        <button className="btn-secondary subtask-add-btn" type="submit">
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}
