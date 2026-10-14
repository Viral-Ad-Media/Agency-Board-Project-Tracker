import { LayoutGrid, Plus } from "lucide-react";

type EmptyBoardStateProps = {
  onAddTask: () => void;
};

export function EmptyBoardState({ onAddTask }: EmptyBoardStateProps) {
  return (
    <section className="empty-board" aria-label="No tasks yet">
      <div className="empty-board-icon" aria-hidden="true">
        <LayoutGrid size={28} />
      </div>
      <h2 className="empty-board-title">No tasks yet</h2>
      <p className="empty-board-message">
        Your board is empty. Create your first task card to start tracking work.
      </p>
      <ul className="empty-board-tips">
        <li>Drag cards between columns to update their status</li>
        <li>Click a card to see full details, stages, and subtasks</li>
        <li>Customize columns and team members from the header</li>
      </ul>
      <button className="btn-primary empty-board-btn" type="button" onClick={onAddTask}>
        <Plus size={15} />
        Create your first task
      </button>
    </section>
  );
}
