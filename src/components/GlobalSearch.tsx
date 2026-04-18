import { useEffect, useRef, useState } from "react";
import { LuBook, LuFileText, LuSearch, LuX } from "react-icons/lu";
import type { Note, Notebook } from "../types/database";
import { searchNotes } from "../services/notes";

interface GlobalSearchProps {
  notebooks: Notebook[];
  onNavigate: (note: Note) => void;
  onNavigateToNotebook: (notebookId: string) => void;
  onClose: () => void;
}

export default function GlobalSearch({
  notebooks,
  onNavigate,
  onNavigateToNotebook,
  onClose,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [noteResults, setNoteResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const notebookResults = query.trim()
    ? notebooks.filter((nb) =>
        nb.title.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const notebookMap = new Map(notebooks.map((nb) => [nb.id, nb.title]));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setNoteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchNotes(query);
        setNoteResults(found);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = notebookResults.length > 0 || noteResults.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-eggplant/70 pt-20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border-2 border-blush bg-frost shadow-2xl dark:border-orchid dark:bg-plum"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b-2 border-blush px-4 py-3 dark:border-orchid">
          <LuSearch size={16} className="shrink-0 text-mauve dark:text-orchid" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notebooks and notes..."
            className="flex-1 bg-transparent text-sm text-eggplant outline-none placeholder:text-mauve dark:text-frost dark:placeholder:text-mauve"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-0.5 text-mauve transition-colors hover:text-eggplant dark:text-mauve dark:hover:text-petal"
            aria-label="Close search"
          >
            <LuX size={14} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-mauve">Searching...</div>
          )}
          {!loading && !query.trim() && (
            <div className="px-4 py-3 text-xs text-mauve dark:text-mauve">
              Type to search notebooks and notes.{" "}
              <kbd className="rounded border border-blush px-1 py-0.5 text-xs dark:border-orchid">
                Ctrl+K
              </kbd>
            </div>
          )}
          {!loading && query.trim() && !hasResults && (
            <div className="px-4 py-3 text-sm text-mauve">No results.</div>
          )}

          {notebookResults.length > 0 && (
            <>
              <div className="border-b-2 border-blush px-4 py-1.5 dark:border-orchid">
                <span className="text-xs font-semibold uppercase tracking-wider text-mauve dark:text-orchid">
                  Notebooks
                </span>
              </div>
              {notebookResults.map((nb) => (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => onNavigateToNotebook(nb.id)}
                  className="flex w-full items-center gap-3 border-b border-blush px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-petal dark:border-orchid dark:hover:bg-void"
                >
                  <LuBook size={14} className="shrink-0 text-mauve dark:text-orchid" />
                  <span className="text-sm font-medium text-eggplant dark:text-frost">
                    {nb.title}
                  </span>
                </button>
              ))}
            </>
          )}

          {noteResults.length > 0 && (
            <>
              <div className="border-b-2 border-blush px-4 py-1.5 dark:border-orchid">
                <span className="text-xs font-semibold uppercase tracking-wider text-mauve dark:text-orchid">
                  Notes
                </span>
              </div>
              {noteResults.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onNavigate(note)}
                  className="flex w-full items-center gap-3 border-b border-blush px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-petal dark:border-orchid dark:hover:bg-void"
                >
                  <LuFileText size={14} className="shrink-0 text-mauve dark:text-orchid" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-eggplant dark:text-frost">
                      {note.title}
                    </div>
                    <div className="truncate text-xs text-mauve dark:text-mauve">
                      {notebookMap.get(note.notebook_id) ?? "Unknown notebook"}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
