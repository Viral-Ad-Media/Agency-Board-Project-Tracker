import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { TEAM_MEMBERS, type Task, type TeamMember } from "../lib/projects";

type TaskChecklistProps = {
  tasks: Task[];
  onAdd: (title: string) => void;
  onToggle: (taskId: string) => void;
  onAssign: (taskId: string, assignee: "" | TeamMember) => void;
  onDelete: (taskId: string) => void;
};

export function TaskChecklist({ tasks, onAdd, onToggle, onAssign, onDelete }: TaskChecklistProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    onAdd(trimmed);
    setNewTaskTitle("");
  }

  return (
    <div className="task-checklist">
      {tasks.length > 0 ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className={`task-row${task.done ? " done" : ""}`} key={task.id}>
              <label className="task-checkbox">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggle(task.id)}
                  aria-label={`Mark "${task.title}" ${task.done ? "incomplete" : "complete"}`}
                />
                <span className="task-title">{task.title}</span>
              </label>

              <select
                className="task-assignee-select"
                value={task.assignee}
                onChange={(event) => onAssign(task.id, event.target.value as "" | TeamMember)}
                aria-label={`Assignee for "${task.title}"`}
              >
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map((member) => (
                  <option value={member} key={member}>
                    {member}
                  </option>
                ))}
              </select>

              <button
                className="icon-btn icon-btn-danger"
                type="button"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete task "${task.title}"`}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="task-empty">No tasks yet.</p>
      )}

      <form className="task-add-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          type="text"
          placeholder="Add a task..."
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
        />
        <button className="btn-secondary task-add-btn" type="submit">
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}
