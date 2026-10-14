import { Check, Copy, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Tooltip } from "./Tooltip";
import type { WorkspaceMember } from "../lib/workspace";

type TeamSettingsModalProps = {
  isOpen: boolean;
  members: WorkspaceMember[];
  memberCounts: Record<string, number>;
  isOwner: boolean;
  onClose: () => void;
  onRemove: (memberId: string) => void;
  onInvite: (email: string, name: string) => Promise<string>;
};

export function TeamSettingsModal({
  isOpen,
  members,
  memberCounts,
  isOwner,
  onClose,
  onRemove,
  onInvite,
}: TeamSettingsModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;

    setError("");
    setIsSubmitting(true);

    try {
      const token = await onInvite(trimmedEmail, trimmedName);
      setLastInviteToken(token);
      setName("");
      setEmail("");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Couldn't send that invite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedToken(token);
        window.setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 2000);
      })
      .catch(() => {
        window.prompt("Copy this invite link:", link);
      });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Team Members</h2>
            <p className="modal-subtitle">
              Invite teammates by email. They&apos;ll get a real login and can be assigned to
              tasks and subtasks once they accept.
            </p>
          </div>
          <Tooltip label="Close">
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </Tooltip>
        </div>

        <ul className="settings-list">
          {members.map((member) => {
            const count = memberCounts[member.id] ?? 0;
            const canRemove = isOwner && member.role !== "owner" && count === 0;

            return (
              <li className="settings-row" key={member.id}>
                <span className="settings-name settings-name-static">
                  {member.name}
                  <span
                    className={`settings-status ${
                      member.status === "active" ? "settings-status-active" : "settings-status-invited"
                    }`}
                  >
                    {member.status === "active" ? "Active" : "Invited"}
                  </span>
                </span>
                <span className="settings-count">{count}</span>
                {isOwner ? (
                  <Tooltip
                    label={
                      member.role === "owner"
                        ? "The workspace owner can't be removed"
                        : count > 0
                          ? "Unassign them from tasks and subtasks first"
                          : `Remove ${member.name}`
                    }
                  >
                    <button
                      className="icon-btn icon-btn-danger"
                      type="button"
                      disabled={!canRemove}
                      onClick={() => onRemove(member.id)}
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </Tooltip>
                ) : null}
              </li>
            );
          })}
        </ul>

        {isOwner ? (
          <>
            <form className="settings-add" onSubmit={handleInviteSubmit}>
              <input
                className="form-input"
                type="text"
                placeholder="Name..."
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                className="form-input"
                type="email"
                placeholder="Email..."
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className="btn-secondary settings-add-btn" type="submit" disabled={isSubmitting}>
                <Plus size={14} />
                {isSubmitting ? "Inviting..." : "Invite"}
              </button>
            </form>
            {error ? <p className="auth-error">{error}</p> : null}
            {lastInviteToken ? (
              <div className="settings-invite-link">
                <code>{`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${lastInviteToken}`}</code>
                <Tooltip label="Copy invite link">
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => copyInviteLink(lastInviteToken)}
                    aria-label="Copy invite link"
                  >
                    {copiedToken === lastInviteToken ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </Tooltip>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="form-actions">
          <button className="btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
