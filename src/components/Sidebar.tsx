import { useCallback, useRef, useState } from "react";
import { LuGripVertical, LuPencil, LuX } from "react-icons/lu";
import type { Notebook } from "../types/database";
import Modal from "./Modal";

export interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onAddNotebook: (name: string) => void;
  onRenameNotebook: (id: string, name: string) => void;
  onDeleteNotebook: (id: string) => void;
  onReorderNotebooks: (notebooks: Notebook[]) => void;
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
  onReorderNotebooks,
}: SidebarProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const notebooksRef = useRef(notebooks);
  const dragFromIndexRef = useRef<number | null>(null);
  const dragEndedAtRef = useRef(0);
  notebooksRef.current = notebooks;
  const touchDragState = useRef<{
    fromIndex: number;
    currentOverIndex: number | null;
  }>({
    fromIndex: -1,
    currentOverIndex: null,
  });

  const clearDragState = useCallback(() => {
    dragFromIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
    dragEndedAtRef.current = Date.now();
  }, []);

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

  const doReorder = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...notebooksRef.current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorderNotebooks(next);
    },
    [onReorderNotebooks],
  );

  const startTouchDrag = useCallback(
    (index: number) => {
      dragFromIndexRef.current = index;
      touchDragState.current = { fromIndex: index, currentOverIndex: null };
      setDragIndex(index);

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        for (let i = 0; i < itemRefs.current.length; i++) {
          const el = itemRefs.current[i];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            if (touchDragState.current.currentOverIndex !== i) {
              touchDragState.current.currentOverIndex = i;
              setDragOverIndex(i);
            }
            break;
          }
        }
      };

      const handleTouchEnd = () => {
        const { fromIndex, currentOverIndex } = touchDragState.current;
        if (
          fromIndex !== -1 &&
          currentOverIndex !== null &&
          fromIndex !== currentOverIndex
        ) {
          doReorder(fromIndex, currentOverIndex);
        }
        clearDragState();
        touchDragState.current = { fromIndex: -1, currentOverIndex: null };
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [clearDragState, doReorder],
  );

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
            className="rounded-lg bg-mauve px-3 py-1 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost"
            onClick={() => setModal({ mode: "create" })}
          >
            + New
          </button>
        </div>
        <nav className="max-h-72 overflow-x-hidden overflow-y-auto pr-1 md:min-h-0 md:max-h-none md:flex-1">
          <ul
            className="m-0 grid list-none gap-1.5 p-0"
            onDrop={(e) => {
              e.preventDefault();
              clearDragState();
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {notebooks.map((nb, i) => {
              const isActive = nb.id === activeNotebookId;
              const isDraggingThis = dragIndex === i;
              const isDragOverThis =
                dragOverIndex === i && dragIndex !== null && dragIndex !== i;

              const itemCls = [
                "group flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-all",
                isDraggingThis ? "opacity-40 scale-[0.98]" : "",
                isDragOverThis
                  ? "border-mauve/50 bg-mauve/10 dark:bg-mauve/10"
                  : isActive
                    ? "border-eggplant/25 bg-eggplant dark:border-blush/40 dark:bg-blush"
                    : "border-mauve/20 bg-white hover:border-mauve/40 dark:border-mauve/20 dark:bg-[#2d2238] dark:hover:border-mauve/40 dark:hover:bg-[#352840]",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li
                  key={nb.id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (dragOverIndex !== i) setDragOverIndex(i);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverIndex !== i) setDragOverIndex(i);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragFromIndexRef.current;
                    if (from !== null && from !== i) doReorder(from, i);
                    clearDragState();
                  }}
                >
                  <div className={itemCls}>
                    <div
                      className={[
                        "flex shrink-0 cursor-grab items-center justify-center self-stretch px-0.5 opacity-0 transition-opacity select-none touch-none group-hover:opacity-100 active:cursor-grabbing",
                        isActive
                          ? "text-petal/50 hover:text-petal dark:text-eggplant/50 dark:hover:text-eggplant"
                          : "text-mauve/40 hover:text-mauve",
                      ].join(" ")}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        dragFromIndexRef.current = i;
                        setDragIndex(i);
                        setDragOverIndex(i);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", nb.id);
                      }}
                      onDragEnd={() => {
                        clearDragState();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        startTouchDrag(i);
                      }}
                    >
                      <LuGripVertical size={10} />
                    </div>
                    <button
                      type="button"
                      className={[
                        "min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-sm font-medium",
                        isActive
                          ? "text-petal dark:text-eggplant"
                          : "text-eggplant dark:text-frost",
                      ].join(" ")}
                      onClick={() => {
                        if (Date.now() - dragEndedAtRef.current < 180) return;
                        onSelectNotebook(nb.id);
                      }}
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
                        setModal({
                          mode: "edit",
                          notebookId: nb.id,
                          currentName: nb.title,
                        })
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
                        setModal({
                          mode: "delete",
                          notebookId: nb.id,
                          currentName: nb.title,
                        })
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
            modal.mode === "create"
              ? "Create"
              : modal.mode === "edit"
                ? "Save"
                : "Delete"
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
