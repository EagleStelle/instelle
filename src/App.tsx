import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Layout from "./components/Layout";
import Auth from "./components/Auth";
import ResetPassword from "./components/ResetPassword";
import NotesGallery from "./pages/NotesGallery";
import NoteView from "./pages/NoteView";
import type { Notebook, Note } from "./types/database";
import {
  fetchNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
} from "./services/notebooks";

interface NoteDraftActions {
  save: () => Promise<boolean>;
  discard: () => void;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [hasUnsavedNoteChanges, setHasUnsavedNoteChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const noteDraftActionsRef = useRef<NoteDraftActions | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const notebookOrderKey = session?.user
    ? `instelle:notebook-order:${session.user.id}`
    : null;

  const sortNotebooksByStoredOrder = useCallback(
    (items: Notebook[]): Notebook[] => {
      if (!notebookOrderKey) return items;

      try {
        const raw = localStorage.getItem(notebookOrderKey);
        if (!raw) return items;

        const orderedIds = JSON.parse(raw);
        if (!Array.isArray(orderedIds)) return items;

        const rank = new Map<string, number>();
        orderedIds.forEach((id, index) => {
          if (typeof id === "string") rank.set(id, index);
        });

        return [...items].sort((a, b) => {
          const aRank = rank.get(a.id);
          const bRank = rank.get(b.id);
          if (aRank === undefined && bRank === undefined) {
            return a.created_at.localeCompare(b.created_at);
          }
          if (aRank === undefined) return 1;
          if (bRank === undefined) return -1;
          return aRank - bRank;
        });
      } catch {
        return items;
      }
    },
    [notebookOrderKey],
  );

  const persistNotebookOrder = useCallback(
    (items: Notebook[]) => {
      if (!notebookOrderKey) return;
      localStorage.setItem(
        notebookOrderKey,
        JSON.stringify(items.map((nb) => nb.id)),
      );
    },
    [notebookOrderKey],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      } else {
        setIsRecovery(false);
      }
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setNotebooks([]);
      setActiveNotebookId(null);
      setSelectedNote(null);
      return;
    }

    fetchNotebooks().then((data) => {
      const ordered = sortNotebooksByStoredOrder(data);
      setNotebooks(ordered);
      if (ordered.length > 0) setActiveNotebookId(ordered[0].id);
    });
  }, [session, sortNotebooksByStoredOrder]);

  useEffect(() => {
    setSelectedNote(null);
  }, [activeNotebookId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedNoteChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedNoteChanges]);

  useEffect(() => {
    if (selectedNote) return;
    setHasUnsavedNoteChanges(false);
    setShowUnsavedModal(false);
    noteDraftActionsRef.current = null;
    pendingNavigationRef.current = null;
  }, [selectedNote]);

  const requestGuardedNavigation = useCallback(
    (action: () => void) => {
      if (!selectedNote || !hasUnsavedNoteChanges) {
        action();
        return;
      }
      pendingNavigationRef.current = action;
      setShowUnsavedModal(true);
    },
    [hasUnsavedNoteChanges, selectedNote],
  );

  const runPendingNavigation = () => {
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowUnsavedModal(false);
    if (pending) pending();
  };

  const handleSaveAndLeave = async () => {
    const ok = await noteDraftActionsRef.current?.save();
    if (!ok) return;
    setHasUnsavedNoteChanges(false);
    runPendingNavigation();
  };

  const handleDiscardAndLeave = () => {
    noteDraftActionsRef.current?.discard();
    setHasUnsavedNoteChanges(false);
    runPendingNavigation();
  };

  const handleStay = () => {
    pendingNavigationRef.current = null;
    setShowUnsavedModal(false);
  };

  const handleAddNotebook = async (title: string) => {
    const nb = await createNotebook(title);
    setNotebooks((prev) => {
      const next = [...prev, nb];
      persistNotebookOrder(next);
      return next;
    });
    setActiveNotebookId(nb.id);
  };

  const handleRenameNotebook = async (id: string, title: string) => {
    await updateNotebook(id, title);
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === id ? { ...nb, title } : nb)),
    );
  };

  const handleDeleteNotebook = async (id: string) => {
    if (notebooks.length === 1) return;
    await deleteNotebook(id);
    const remaining = notebooks.filter((nb) => nb.id !== id);
    setNotebooks(remaining);
    persistNotebookOrder(remaining);
    if (id === activeNotebookId) {
      setActiveNotebookId(remaining[0]?.id ?? null);
      setSelectedNote(null);
    }
  };

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  if (authLoading) return null;
  if (isRecovery) return <ResetPassword onDone={() => setIsRecovery(false)} />;
  if (!session) return <Auth />;

  return (
    <>
      <Layout
        notebooks={notebooks}
        activeNotebookId={activeNotebookId ?? ""}
        onSelectNotebook={(id) => {
          requestGuardedNavigation(() => {
            if (id === activeNotebookId && selectedNote) {
              setSelectedNote(null);
            } else {
              setActiveNotebookId(id);
            }
          });
        }}
        onAddNotebook={handleAddNotebook}
        onRenameNotebook={handleRenameNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onReorderNotebooks={(reordered) => {
          setNotebooks(reordered);
          persistNotebookOrder(reordered);
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onSignOut={() =>
          requestGuardedNavigation(() => {
            void supabase.auth.signOut();
          })
        }
      >
        {selectedNote ? (
          <NoteView
            noteId={selectedNote.id}
            noteTitle={selectedNote.title}
            onBack={() => requestGuardedNavigation(() => setSelectedNote(null))}
            onDirtyChange={setHasUnsavedNoteChanges}
            onRegisterDraftActions={(actions) => {
              noteDraftActionsRef.current = actions;
            }}
          />
        ) : activeNotebook ? (
          <NotesGallery
            notebookId={activeNotebook.id}
            notebookTitle={activeNotebook.title}
            onSelectNote={setSelectedNote}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-mauve">
            Select or create a notebook.
          </div>
        )}
      </Layout>

      {showUnsavedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-eggplant/45 p-4 backdrop-blur-sm dark:bg-eggplant/65"
          onClick={handleStay}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-mauve/25 bg-frost p-5 shadow-xl dark:border-mauve/25 dark:bg-[#2d2238]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-eggplant dark:text-frost">
              Unsaved changes
            </h3>
            <p className="mt-1 text-sm text-mauve dark:text-mauve/85">
              Save edits before leaving this note?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleSaveAndLeave();
                }}
                className="rounded-lg bg-mauve px-3 py-1.5 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost"
              >
                Save and leave
              </button>
              <button
                type="button"
                onClick={handleDiscardAndLeave}
                className="rounded-lg border border-mauve/35 px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:bg-mauve/15 dark:text-frost"
              >
                Don&apos;t save
              </button>
              <button
                type="button"
                onClick={handleStay}
                className="rounded-lg border border-mauve/35 px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:bg-mauve/15 dark:text-frost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
