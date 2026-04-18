import { useCallback, useRef, useState } from "react";
import { LuGripVertical, LuPencil, LuPlus, LuX } from "react-icons/lu";
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
  mobileOpen?: boolean;
  onRequestCloseMobile?: () => void;
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
  mobileOpen = false,
  onRequestCloseMobile,
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
        className={[
          "absolute left-0 right-0 top-0 z-30 w-full shrink-0 border-b-2 border-blush bg-petal p-4 transition-all duration-200 md:relative md:left-auto md:right-auto md:top-auto md:z-10 md:flex md:min-h-0 md:w-80 md:flex-col md:overflow-hidden md:border-b-0 md:border-r-2 dark:border-orchid dark:bg-dusk",
          mobileOpen
            ? "pointer-events-auto visible translate-y-0"
            : "pointer-events-none invisible -translate-y-3 md:pointer-events-auto md:visible md:translate-y-0",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-sm font-bold uppercase tracking-widest text-eggplant dark:text-petal md:text-base">
            Notebooks
          </h2>
          <button
            type="button"
            aria-label="New notebook"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-eggplant bg-blush text-sm font-semibold text-eggplant transition-colors hover:bg-mauve hover:border-eggplant hover:text-frost md:w-auto md:gap-1.5 md:px-3 dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal"
            onClick={() => setModal({ mode: "create" })}
          >
            <LuPlus size={14} />
            <span className="hidden md:inline">New</span>
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
                "group flex items-center gap-1 rounded-lg border-2 px-2 py-1.5 transition-all",
                isDraggingThis ? "scale-[0.98] ring-2 ring-mauve dark:ring-orchid" : "",
                isDragOverThis
                  ? "border-mauve bg-blush dark:border-orchid dark:bg-plum"
                  : isActive
                    ? "border-mauve bg-mauve dark:border-orchid dark:bg-orchid"
                    : "border-blush bg-white hover:border-mauve dark:border-mauve dark:bg-plum dark:hover:border-orchid",
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
                        "invisible flex shrink-0 cursor-grab items-center justify-center self-stretch px-0.5 transition-colors select-none touch-none group-hover:visible active:cursor-grabbing",
                        isActive
                          ? "text-frost hover:text-blush dark:text-frost dark:hover:text-blush"
                          : "text-mauve hover:text-eggplant dark:text-mauve dark:hover:text-petal",
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
                        "max-w-full min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-sm font-medium",
                        isActive
                          ? "text-frost dark:text-frost"
                          : "text-eggplant dark:text-petal",
                      ].join(" ")}
                      onClick={() => {
                        if (Date.now() - dragEndedAtRef.current < 180) return;
                        onSelectNotebook(nb.id);
                        onRequestCloseMobile?.();
                      }}
                    >
                      {nb.title}
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-lg p-1 transition-colors",
                        isActive
                          ? "text-frost hover:text-blush dark:text-frost dark:hover:text-blush"
                          : "text-mauve hover:text-eggplant dark:text-mauve dark:hover:text-petal",
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
                          ? "text-frost hover:text-red-200 dark:text-frost dark:hover:text-red-300"
                          : "text-mauve hover:text-red-600 dark:text-mauve dark:hover:text-red-400",
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
