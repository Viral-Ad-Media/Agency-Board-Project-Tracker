import { Undo2 } from "lucide-react";

type UndoToastProps = {
  projectName: string | null;
  onUndo: () => void;
};

export function UndoToast({ projectName, onUndo }: UndoToastProps) {
  if (!projectName) return null;

  return (
    <div className="undo-toast" role="status">
      <span className="undo-toast-message">
        Deleted <strong>&quot;{projectName}&quot;</strong>
      </span>
      <button className="btn-undo" type="button" onClick={onUndo}>
        <Undo2 size={12} aria-hidden="true" />
        Undo
      </button>
    </div>
  );
}
