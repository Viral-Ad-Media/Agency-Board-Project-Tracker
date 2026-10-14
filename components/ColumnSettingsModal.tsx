import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";
import type { BoardColumnDef } from "../lib/tasks";

type ColumnSettingsModalProps = {
  isOpen: boolean;
  columns: BoardColumnDef[];
  columnCounts: Record<string, number>;
  onClose: () => void;
  onRename: (columnId: string, name: string) => void;
  onToggleComplete: (columnId: string, countsAsComplete: boolean) => void;
  onMove: (columnId: string, direction: "up" | "down") => void;
  onDelete: (columnId: string) => void;
  onAdd: (name: string) => void;
};

export function ColumnSettingsModal({
  isOpen,
  columns,
  columnCounts,
  onClose,
  onRename,
  onToggleComplete,
  onMove,
  onDelete,
  onAdd,
}: ColumnSettingsModalProps) {
  const [newColumnName, setNewColumnName] = useState("");

  function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newColumnName.trim();
    if (!trimmed) return;

    onAdd(trimmed);
    setNewColumnName("");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Board Columns</h2>
            <p className="modal-subtitle">
              Rename, reorder, or remove workflow columns. Columns with cards can&apos;t be
              deleted.
            </p>
          </div>
          <Tooltip label="Close">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <ul className="settings-list">
          {columns.map((column, index) => {
            const count = columnCounts[column.id] ?? 0;

            return (
              <li className="settings-row" key={column.id}>
                <div className="column-settings-reorder">
                  <Tooltip label="Move up">
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMove(column.id, "up")}
                      aria-label={`Move ${column.name} up`}
                    >
                      <ArrowUp size={13} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Move down">
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={index === columns.length - 1}
                      onClick={() => onMove(column.id, "down")}
                      aria-label={`Move ${column.name} down`}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </Tooltip>
                </div>

                <input
                  className="form-input settings-name"
                  type="text"
                  value={column.name}
                  onChange={(event) => onRename(column.id, event.target.value)}
                  aria-label={`Column name for ${column.name}`}
                />

                <label className="column-settings-complete">
                  <input
                    type="checkbox"
                    checked={column.countsAsComplete}
                    onChange={(event) => onToggleComplete(column.id, event.target.checked)}
                  />
                  Counts as complete
                </label>

                <span className="settings-count">{count}</span>

                <Tooltip
                  label={
                    count > 0
                      ? "Move or delete its cards first"
                      : columns.length <= 1
                        ? "The board needs at least one column"
                        : `Delete ${column.name}`
                  }
                >
                  <button
                    className="icon-btn icon-btn-danger"
                    type="button"
                    disabled={count > 0 || columns.length <= 1}
                    onClick={() => onDelete(column.id)}
                    aria-label={`Delete ${column.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>

        <form className="settings-add" onSubmit={handleAddSubmit}>
          <input
            className="form-input"
            type="text"
            placeholder="New column name..."
            value={newColumnName}
            onChange={(event) => setNewColumnName(event.target.value)}
          />
          <button className="btn-secondary settings-add-btn" type="submit">
            <Plus size={14} />
            Add Column
          </button>
        </form>

        <div className="form-actions">
          <button className="btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
