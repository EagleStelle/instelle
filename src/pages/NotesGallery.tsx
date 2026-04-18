import { useEffect, useState } from "react";
import { LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
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

export default function NotesGallery({
  notebookId,
  notebookTitle,
  onSelectNote,
}: NotesGalleryProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [firstContents, setFirstContents] = useState<Record<string, string>>(
    {},
  );
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    setFilterQuery("");
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
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const filteredNotes = filterQuery.trim()
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : notes;

  return (
    <>
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="min-w-0 flex-1 truncate text-2xl font-bold text-eggplant dark:text-frost sm:text-3xl">
            {notebookTitle}
          </h2>
          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            aria-label="Create note"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-eggplant bg-mauve text-sm font-semibold text-frost transition-colors hover:bg-eggplant hover:border-eggplant hover:text-frost md:w-auto md:gap-1.5 md:px-3 dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal"
          >
            <LuPlus size={14} />
            <span className="hidden md:inline">New</span>
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border-2 border-blush bg-white px-3 py-2 dark:border-orchid dark:bg-plum">
          <LuSearch size={14} className="shrink-0 text-mauve dark:text-orchid" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search notes in this notebook..."
            className="flex-1 bg-transparent text-sm text-eggplant outline-none placeholder:text-mauve dark:text-frost dark:placeholder:text-mauve"
          />
        </div>

        {loading ? (
          <div className="text-sm text-mauve">Loading...</div>
        ) : filteredNotes.length === 0 && filterQuery ? (
          <div className="py-10 text-center text-sm text-mauve">
            No notes match &ldquo;{filterQuery}&rdquo;.
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-mauve">No notes yet.</p>
            <button
              type="button"
              onClick={() => setModal({ mode: "create" })}
              aria-label="Create first note"
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-eggplant bg-mauve px-2.5 py-1.5 text-sm font-semibold text-frost transition-colors hover:bg-eggplant hover:border-eggplant hover:text-frost dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal md:px-3"
            >
              <LuPlus size={14} />
              <span>Create first note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group relative flex min-h-32 cursor-pointer flex-col rounded-lg border-2 border-blush bg-white p-4 transition-all hover:border-mauve dark:border-orchid dark:bg-plum dark:hover:border-petal"
                onClick={() => onSelectNote(note)}
              >
                <h3 className="mb-1.5 line-clamp-1 text-sm font-bold text-eggplant dark:text-frost">
                  {note.title}
                </h3>
                {firstContents[note.id] && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-mauve dark:text-mauve">
                    {firstContents[note.id]}
                  </p>
                )}
                <p className="mt-auto pt-2 text-xs text-mauve dark:text-mauve">
                  {fmt(note.created_at)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({
                      mode: "delete",
                      noteId: note.id,
                      noteTitle: note.title,
                    });
                  }}
                  className="absolute right-2.5 top-2.5 rounded-lg border border-blush bg-white p-1 text-mauve transition-all hover:border-mauve hover:bg-petal hover:text-red-600 dark:border-plum dark:bg-plum dark:text-mauve dark:hover:border-orchid dark:hover:bg-void dark:hover:text-red-400"
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
          description={
            modal.mode === "delete"
              ? `Type "confirm" to delete "${modal.noteTitle}"`
              : undefined
          }
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
