import type { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ isOpen, children, onClose }: ModalProps) {
  return (
    <div
      className={`modal-overlay${isOpen ? " active" : ""}`}
      aria-hidden={!isOpen}
      aria-modal="true"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {isOpen ? children : null}
    </div>
  );
}
