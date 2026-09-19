"use client";
import { Modal } from "./Modal";

export function ConfirmDialog({ open, title, body, confirmLabel = "Delete", busy, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel?: string; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-5 text-dim">{body}</p>
      <div className="flex gap-3">
        <button className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger flex-1" onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
