import { Download, FileText, Image as ImageIcon, Paperclip, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Tooltip } from "./Tooltip";
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  formatFileSize,
  type TaskAttachment,
} from "../lib/tasks";

type AttachmentListProps = {
  attachments: TaskAttachment[];
  isUploading: boolean;
  onUpload: (file: File) => void;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachmentId: string) => void;
};

export function AttachmentList({
  attachments,
  isUploading,
  onUpload,
  onDownload,
  onDelete,
}: AttachmentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      window.alert(
        `"${file.name}" is too large. Attachments are limited to ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.`,
      );
      return;
    }

    onUpload(file);
  }

  return (
    <div className="subtask-checklist">
      {attachments.length > 0 ? (
        <ul className="attachment-list">
          {attachments.map((attachment) => {
            const isImage = attachment.contentType.startsWith("image/");
            const Icon = isImage ? ImageIcon : FileText;

            return (
              <li className="attachment-row" key={attachment.id}>
                <span className="attachment-icon" aria-hidden="true">
                  <Icon size={14} />
                </span>
                <span className="attachment-info">
                  <span className="attachment-name">{attachment.fileName}</span>
                  <span className="attachment-size">{formatFileSize(attachment.fileSize)}</span>
                </span>
                <Tooltip label="Download">
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => onDownload(attachment)}
                    aria-label={`Download "${attachment.fileName}"`}
                  >
                    <Download size={13} />
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    className="icon-btn icon-btn-danger"
                    type="button"
                    onClick={() => onDelete(attachment.id)}
                    aria-label={`Delete "${attachment.fileName}"`}
                  >
                    <Trash2 size={13} />
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="subtask-empty">No files attached yet.</p>
      )}

      <div className="attachment-add-row">
        <button
          className="btn-secondary subtask-add-btn"
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={14} />
          {isUploading ? "Uploading..." : "Attach a File"}
        </button>
        <span className="attachment-hint">Max {formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}</span>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(event) => {
            handleFileChange(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
