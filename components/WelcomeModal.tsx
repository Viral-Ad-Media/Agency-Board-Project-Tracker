import { LayoutGrid } from "lucide-react";
import { Modal } from "./Modal";

type WelcomeModalProps = {
  isOpen: boolean;
  onSkip: () => void;
  onStartTour: () => void;
};

export function WelcomeModal({ isOpen, onSkip, onStartTour }: WelcomeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onSkip}>
      <div className="modal confirm-modal welcome-modal">
        <div className="modal-header confirm-header">
          <div className="confirm-icon welcome-icon" aria-hidden="true">
            <LayoutGrid size={24} />
          </div>
          <h2 className="modal-title confirm-title">Welcome to Agency Board</h2>
          <p className="confirm-message">
            A kanban-style tracker for your team&apos;s work. Create task cards, drag them through
            your workflow, and break each one down into subtasks.
          </p>
        </div>
        <ul className="welcome-points">
          <li>Customize columns and team members from the header</li>
          <li>Drag cards between columns to update their status</li>
          <li>Click a card to see full details, stages, and subtasks</li>
        </ul>
        <div className="form-actions confirm-actions">
          <button className="btn-secondary" type="button" onClick={onSkip}>
            Skip for now
          </button>
          <button className="btn-primary" type="button" onClick={onStartTour}>
            Take the Tour
          </button>
        </div>
      </div>
    </Modal>
  );
}
