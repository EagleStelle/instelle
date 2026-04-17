import { useEffect, useState } from "react";
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

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true);
        } else {
          setIsRecovery(false);
        }
        setSession(session);
        setAuthLoading(false);
      },
    );

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
      setNotebooks(data);
      if (data.length > 0) setActiveNotebookId(data[0].id);
    });
  }, [session]);

  useEffect(() => {
    setSelectedNote(null);
  }, [activeNotebookId]);

  const handleAddNotebook = async (title: string) => {
    const nb = await createNotebook(title);
    setNotebooks((prev) => [...prev, nb]);
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
    <Layout
      notebooks={notebooks}
      activeNotebookId={activeNotebookId ?? ""}
      onSelectNotebook={(id) => { setActiveNotebookId(id); }}
      onAddNotebook={handleAddNotebook}
      onRenameNotebook={handleRenameNotebook}
      onDeleteNotebook={handleDeleteNotebook}
      isDark={isDark}
      onToggleTheme={() => setIsDark((d) => !d)}
      onSignOut={() => supabase.auth.signOut()}
    >
      {selectedNote ? (
        <NoteView
          noteId={selectedNote.id}
          noteTitle={selectedNote.title}
          onBack={() => setSelectedNote(null)}
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
  );
}

export default App;
