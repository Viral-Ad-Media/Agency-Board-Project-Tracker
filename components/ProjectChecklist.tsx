import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Tooltip } from "./Tooltip";
import type { ProjectChecklistItem } from "../lib/tasks";

type ProjectChecklistProps = {
  items: ProjectChecklistItem[];
  emptyLabel: string;
  addPlaceholder: string;
  onAdd: (title: string) => void;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
};

export function ProjectChecklist({
  items,
  emptyLabel,
  addPlaceholder,
  onAdd,
  onToggle,
  onDelete,
}: ProjectChecklistProps) {
  const [newTitle, setNewTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    onAdd(trimmed);
    setNewTitle("");
  }

  return (
    <div className="subtask-checklist">
      {items.length > 0 ? (
        <ul className="subtask-list">
          {items.map((item) => (
            <li className={`subtask-row${item.done ? " done" : ""}`} key={item.id}>
              <label className="subtask-checkbox">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(item.id)}
                  aria-label={`Mark "${item.title}" ${item.done ? "incomplete" : "complete"}`}
                />
                <span className="subtask-title">{item.title}</span>
              </label>

              <Tooltip label="Delete">
                <button
                  className="icon-btn icon-btn-danger"
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete "${item.title}"`}
                >
                  <X size={13} />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="subtask-empty">{emptyLabel}</p>
      )}

      <form className="subtask-add-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          type="text"
          placeholder={addPlaceholder}
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <button className="btn-secondary subtask-add-btn" type="submit">
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}
