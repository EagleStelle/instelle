import { useEffect, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import type { Note } from "../types/database";
import { fetchNotes, createNote, deleteNote } from "../services/notes";
import { fetchFirstPageContents } from "../services/pages";
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
  const [firstContents, setFirstContents] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    fetchNotes(notebookId)
      .then(async (fetched) => {
        setNotes(fetched);
        const contents = await fetchFirstPageContents(fetched.map((n) => n.id));
        setFirstContents(contents);
      })
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
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-eggplant dark:text-frost">{notebookTitle}</h2>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="rounded-lg bg-mauve px-3 py-1.5 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost"
          >
            + New
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
              className="rounded-lg bg-mauve px-3 py-1.5 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost"
            >
              Create first note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative flex min-h-32 cursor-pointer flex-col rounded-lg border border-mauve/20 bg-white p-4 transition-all hover:border-mauve/50 dark:border-mauve/15 dark:bg-[#2d2238] dark:hover:border-mauve/40"
                onClick={() => onSelectNote(note)}
              >
                <h3 className="mb-1.5 line-clamp-1 text-sm font-bold text-eggplant dark:text-frost">
                  {note.title}
                </h3>
                {firstContents[note.id] && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-eggplant/55 dark:text-frost/55">
                    {firstContents[note.id]}
                  </p>
                )}
                <p className="mt-auto pt-2 text-xs text-mauve/70">{fmt(note.created_at)}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ mode: "delete", noteId: note.id, noteTitle: note.title });
                  }}
                  className="absolute right-2.5 top-2.5 rounded-lg p-1 text-mauve/20 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-900/20 group-hover:opacity-100"
                  aria-label={`Delete ${note.title}`}
                >
                  <LuTrash2 size={12} />
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
