"use client";
import { useEffect, useRef } from "react";

/** Native <dialog>: focus trap, Esc, and backdrop for free. Bottom sheet on phones. */
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-[680px] max-h-[92dvh] rounded-t-xl border border-white/15 bg-surface p-0 text-ink backdrop:bg-black/70 sm:m-auto sm:rounded-xl"
    >
      {open && (
        <div className="max-h-[92dvh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <h2 className="h-display mb-4 text-3xl text-lime">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
