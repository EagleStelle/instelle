import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LuSave, LuTrash2, LuX } from "react-icons/lu";
import { supabase } from "./lib/supabase";
import Layout from "./components/Layout";
import Auth from "./components/Auth";
import ResetPassword from "./components/ResetPassword";
import SettingsPasswordModal from "./components/SettingsPasswordModal";
import GlobalSearch from "./components/GlobalSearch";
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
  const isRecoveryUrl = () => {
    const isResetPath = window.location.pathname === "/reset-password";
    const hasRecoveryHash =
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery");
    return isResetPath || hasRecoveryHash;
  };

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [hasUnsavedNoteChanges, setHasUnsavedNoteChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isRecovery, setIsRecovery] = useState(isRecoveryUrl);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
      if (isRecoveryUrl()) {
        setIsRecovery(true);
      }
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || isRecoveryUrl()) {
        setIsRecovery(true);
      } else if (event === "SIGNED_OUT") {
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  const handleNavigateToNote = useCallback(
    (note: Note) => {
      requestGuardedNavigation(() => {
        setActiveNotebookId(note.notebook_id);
        setSelectedNote(note);
        setGlobalSearchOpen(false);
      });
    },
    [requestGuardedNavigation],
  );

  const handleNavigateToNotebook = useCallback(
    (notebookId: string) => {
      requestGuardedNavigation(() => {
        setActiveNotebookId(notebookId);
        setSelectedNote(null);
        setGlobalSearchOpen(false);
      });
    },
    [requestGuardedNavigation],
  );

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId);

  if (authLoading) return null;
  if (isRecovery)
    return (
      <ResetPassword
        onDone={() => {
          setIsRecovery(false);
          window.history.replaceState({}, "", "/");
        }}
      />
    );
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
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={() =>
          requestGuardedNavigation(() => {
            void supabase.auth.signOut();
          })
        }
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
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

      {globalSearchOpen && (
        <GlobalSearch
          notebooks={notebooks}
          onNavigate={handleNavigateToNote}
          onNavigateToNotebook={handleNavigateToNotebook}
          onClose={() => setGlobalSearchOpen(false)}
        />
      )}

      {showUnsavedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-eggplant/70 p-4"
          onClick={handleStay}
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-blush bg-frost p-5 shadow-xl dark:border-orchid dark:bg-plum"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-eggplant dark:text-petal">
              Unsaved changes
            </h3>
            <p className="mt-1 text-sm text-mauve dark:text-mauve">
              Save edits before leaving this note?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleSaveAndLeave();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-mauve bg-mauve px-3 py-1.5 text-sm font-semibold text-frost transition-colors hover:bg-eggplant hover:border-eggplant hover:text-frost dark:border-orchid dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-mauve"
              >
                <LuSave size={14} />
                Save
              </button>
              <button
                type="button"
                onClick={handleDiscardAndLeave}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blush bg-white px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:border-mauve hover:bg-petal dark:border-mauve dark:bg-void dark:text-petal dark:hover:border-orchid"
              >
                <LuTrash2 size={14} />
                Don&apos;t save
              </button>
              <button
                type="button"
                onClick={handleStay}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-blush bg-white px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:border-mauve hover:bg-petal dark:border-mauve dark:bg-void dark:text-petal dark:hover:border-orchid"
              >
                <LuX size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsPasswordModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

export default App;
