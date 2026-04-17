import { useState } from "react";
import { LuX, LuPencil } from "react-icons/lu";
import type { Notebook } from "../types/database";
import Modal from "./Modal";

export interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onAddNotebook: (name: string) => void;
  onRenameNotebook: (id: string, name: string) => void;
  onDeleteNotebook: (id: string) => void;
}

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; notebookId: string; currentName: string }
  | { mode: "delete"; notebookId: string; currentName: string };

export default function Sidebar({
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onAddNotebook,
  onRenameNotebook,
  onDeleteNotebook,
}: SidebarProps) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const handleConfirm = (name: string) => {
    if (modal?.mode === "create") {
      onAddNotebook(name);
    } else if (modal?.mode === "edit") {
      onRenameNotebook(modal.notebookId, name);
    } else if (modal?.mode === "delete") {
      onDeleteNotebook(modal.notebookId);
    }
    setModal(null);
  };

  return (
    <>
      <aside
        className="relative z-10 w-full shrink-0 border-b border-mauve/20 bg-blush/15 p-4 md:flex md:min-h-0 md:w-80 md:flex-col md:overflow-hidden md:border-b-0 md:border-r dark:border-mauve/15 dark:bg-[#4a3a55]"
        aria-label="Sidebar navigation"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-xs font-bold uppercase tracking-widest text-eggplant dark:text-blush">
            Notebooks
          </h2>
          <button
            type="button"
            className="rounded-xl bg-mauve px-3 py-1 text-sm font-semibold text-frost transition-colors hover:bg-eggplant dark:hover:bg-eggplant"
            onClick={() => setModal({ mode: "create" })}
          >
            + New
          </button>
        </div>
        <nav className="max-h-72 overflow-x-hidden overflow-y-auto pr-1 md:min-h-0 md:max-h-none md:flex-1">
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {notebooks.map((nb) => {
              const isActive = nb.id === activeNotebookId;

              return (
                <li key={nb.id}>
                  <div
                    className={[
                      "flex items-center gap-1 rounded-xl border px-2 py-1.5 transition-all",
                      isActive
                        ? "border-eggplant/25 bg-eggplant dark:border-blush/40 dark:bg-blush"
                        : "border-mauve/20 bg-white hover:border-mauve/40 dark:border-mauve/20 dark:bg-[#2d2238] dark:hover:border-mauve/40 dark:hover:bg-[#352840]",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      className={[
                        "min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-sm font-medium",
                        isActive
                          ? "text-petal dark:text-eggplant"
                          : "text-eggplant dark:text-frost",
                      ].join(" ")}
                      onClick={() => onSelectNotebook(nb.id)}
                    >
                      {nb.title}
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-lg p-1 transition-colors",
                        isActive
                          ? "text-petal/50 hover:text-petal dark:text-eggplant/50 dark:hover:text-eggplant"
                          : "text-mauve/50 hover:text-mauve dark:text-frost/40 dark:hover:text-frost",
                      ].join(" ")}
                      onClick={() =>
                        setModal({ mode: "edit", notebookId: nb.id, currentName: nb.title })
                      }
                      aria-label={`Rename ${nb.title}`}
                    >
                      <LuPencil size={11} />
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-lg p-1 transition-colors",
                        isActive
                          ? "text-petal/60 hover:text-petal dark:text-eggplant/60 dark:hover:text-eggplant"
                          : "text-mauve/60 hover:text-eggplant dark:text-frost/50 dark:hover:text-frost",
                      ].join(" ")}
                      onClick={() =>
                        setModal({ mode: "delete", notebookId: nb.id, currentName: nb.title })
                      }
                      aria-label={`Delete ${nb.title}`}
                    >
                      <LuX size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {modal && (
        <Modal
          title={
            modal.mode === "create"
              ? "New Notebook"
              : modal.mode === "edit"
                ? "Rename Notebook"
                : "Delete Notebook"
          }
          description={
            modal.mode === "edit"
              ? `Renaming "${modal.currentName}"`
              : modal.mode === "delete"
                ? `Type "confirm" to delete "${modal.currentName}"`
                : undefined
          }
          initialValue={modal.mode === "edit" ? modal.currentName : ""}
          placeholder={modal.mode === "delete" ? "confirm" : "Notebook name..."}
          confirmLabel={
            modal.mode === "create" ? "Create" : modal.mode === "edit" ? "Save" : "Delete"
          }
          requiredValue={modal.mode === "delete" ? "confirm" : undefined}
          danger={modal.mode === "delete"}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
