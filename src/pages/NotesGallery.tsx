import { useEffect, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { Note } from "../types/database";
import { fetchNotes, createNote, deleteNote } from "../services/notes";
import Modal from "../components/Modal";

interface NotesGalleryProps {
  notebookId: string;
  notebookTitle: string;
  onSelectNote: (note: Note) => void;
}

type ModalState =
  | { mode: "create" }
  | { mode: "delete"; noteId: string; noteTitle: string };

export default function NotesGallery({ notebookId, notebookTitle, onSelectNote }: NotesGalleryProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchNotes(notebookId)
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [notebookId]);

  const handleConfirm = async (value: string) => {
    if (modal?.mode === "create") {
      const note = await createNote(notebookId, value);
      setNotes((prev) => [...prev, note]);
      onSelectNote(note);
    } else if (modal?.mode === "delete") {
      await deleteNote(modal.noteId);
      setNotes((prev) => prev.filter((n) => n.id !== modal.noteId));
    }
    setModal(null);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-eggplant dark:text-frost">{notebookTitle}</h2>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-1.5 rounded-xl bg-mauve px-4 py-2 text-sm font-semibold text-frost transition-colors hover:bg-eggplant"
          >
            <LuPlus size={15} />
            New Note
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-mauve">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-mauve">No notes yet.</p>
            <button
              type="button"
              onClick={() => setModal({ mode: "create" })}
              className="rounded-xl bg-mauve px-4 py-2 text-sm font-semibold text-frost transition-colors hover:bg-eggplant"
            >
              Create first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative flex h-36 cursor-pointer flex-col rounded-2xl border border-mauve/20 bg-white p-4 transition-all hover:border-mauve/50 dark:border-mauve/15 dark:bg-[#2d2238] dark:hover:border-mauve/40"
                onClick={() => onSelectNote(note)}
              >
                <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-eggplant dark:text-frost">
                  {note.title}
                </h3>
                <p className="mt-auto text-xs text-mauve/70">{fmt(note.created_at)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ mode: "delete", noteId: note.id, noteTitle: note.title });
                  }}
                  className="absolute right-3 top-3 rounded-lg p-1 text-mauve/30 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  aria-label={`Delete ${note.title}`}
                >
                  <LuTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === "create" ? "New Note" : "Delete Note"}
          description={modal.mode === "delete" ? `Type "confirm" to delete "${modal.noteTitle}"` : undefined}
          placeholder={modal.mode === "delete" ? "confirm" : "Note title..."}
          confirmLabel={modal.mode === "create" ? "Create" : "Delete"}
          requiredValue={modal.mode === "delete" ? "confirm" : undefined}
          danger={modal.mode === "delete"}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
