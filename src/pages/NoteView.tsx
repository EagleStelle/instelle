import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuAlignLeft,
  LuArrowLeft,
  LuCheck,
  LuCopy,
  LuGripVertical,
  LuHeading1,
  LuHeading2,
  LuList,
  LuListOrdered,
  LuSquareCheck,
  LuTrash2,
} from "react-icons/lu";
import type { BlockType, Page } from "../types/database";
import { createPage, deletePage, fetchPages, updatePage } from "../services/pages";
import { useFooterContent } from "../context/footerContent";

interface NoteViewProps {
  noteId: string;
  noteTitle: string;
  onBack: () => void;
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={`overflow-hidden resize-none ${className ?? ""}`}
    />
  );
}

const deleteBtn =
  "absolute right-2 top-2 rounded-lg p-1 text-mauve/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400";
const copyBtn =
  "absolute bottom-2 right-2 rounded-lg p-1 text-mauve/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-mauve/10 hover:text-mauve";

function BlockArticle({
  page,
  onDelete,
  onChange,
  onAddCheckbox,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchStart,
}: {
  page: Page;
  onDelete: () => void;
  onChange: (fields: { title?: string; content?: string; checked?: boolean }) => void;
  onAddCheckbox?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onTouchStart?: () => void;
}) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  const save = (fields: { title?: string; content?: string; checked?: boolean }) => {
    onChange(fields);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void updatePage(page.id, fields);
    }, 800);
  };

  const handleCopy = () => {
    const text =
      page.block_type === "paragraph" ||
      page.block_type === "bullet" ||
      page.block_type === "numbered"
        ? page.content || page.title
        : page.title || page.content;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputBase =
    "w-full bg-transparent outline-none placeholder:text-mauve/30 dark:placeholder:text-mauve/25";

  const articleCls = [
    "group relative flex rounded-lg border border-mauve/15 bg-white dark:border-mauve/10 dark:bg-[#2d2238] transition-all",
    isDragging ? "opacity-40 scale-[0.98]" : "",
    isDragOver ? "border-mauve/50 bg-mauve/5 dark:bg-mauve/5" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dragHandle = (
    <div
      className="flex w-5 shrink-0 cursor-grab items-center justify-center self-stretch text-mauve/20 opacity-0 transition-opacity group-hover:opacity-100 select-none touch-none active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onTouchStart={(e) => {
        e.stopPropagation();
        onTouchStart?.();
      }}
    >
      <LuGripVertical size={11} />
    </div>
  );

  const actionBtns = (
    <>
      <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
        <LuTrash2 size={12} />
      </button>
      <button type="button" onClick={handleCopy} className={copyBtn} aria-label="Copy block">
        {copied ? <LuCheck size={12} /> : <LuCopy size={12} />}
      </button>
    </>
  );

  const articleHandlers = {
    className: articleCls,
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      onDragOver?.();
    },
    onDrop: () => onDrop?.(),
  };

  if (page.block_type === "heading") {
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="Heading..."
            className={`${inputBase} text-3xl font-bold text-eggplant dark:text-frost`}
          />
        </div>
      </article>
    );
  }

  if (page.block_type === "subheading") {
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="Subheading..."
            className={`${inputBase} text-xl font-semibold text-eggplant dark:text-frost`}
          />
        </div>
      </article>
    );
  }

  if (page.block_type === "paragraph") {
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pb-8 pr-8">
          {actionBtns}
          <AutoTextarea
            value={page.content}
            onChange={(e) => save({ content: e.target.value })}
            placeholder="Write something..."
            className={`${inputBase} text-sm leading-relaxed text-eggplant/80 dark:text-frost/80`}
          />
        </div>
      </article>
    );
  }

  if (page.block_type === "checkbox") {
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={page.checked}
              onChange={(e) => save({ checked: e.target.checked })}
              className="h-4 w-4 shrink-0 cursor-pointer accent-mauve"
            />
            <input
              type="text"
              value={page.title}
              onChange={(e) => save({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddCheckbox?.();
                }
              }}
              placeholder="Task..."
              className={`${inputBase} text-sm font-medium text-eggplant dark:text-frost ${page.checked ? "line-through opacity-50" : ""}`}
            />
          </div>
        </div>
      </article>
    );
  }

  if (page.block_type === "bullet") {
    const lines = page.content ? page.content.split("\n") : [""];
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pb-8 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="List title (optional)..."
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-frost`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80">
                <span className="mt-0.5 shrink-0 text-mauve">•</span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => {
                    const updated = [...lines];
                    updated[i] = e.target.value;
                    save({ content: updated.join("\n") });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const updated = [...lines];
                      updated.splice(i + 1, 0, "");
                      save({ content: updated.join("\n") });
                    }
                    if (e.key === "Backspace" && line === "" && lines.length > 1) {
                      e.preventDefault();
                      const updated = lines.filter((_, idx) => idx !== i);
                      save({ content: updated.join("\n") });
                    }
                  }}
                  placeholder="Item..."
                  className={`${inputBase} flex-1 leading-relaxed`}
                />
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  if (page.block_type === "numbered") {
    const lines = page.content ? page.content.split("\n") : [""];
    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pb-8 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="List title (optional)..."
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-frost`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80">
                <span className="mt-0.5 min-w-5 shrink-0 text-right text-mauve">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => {
                    const updated = [...lines];
                    updated[i] = e.target.value;
                    save({ content: updated.join("\n") });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const updated = [...lines];
                      updated.splice(i + 1, 0, "");
                      save({ content: updated.join("\n") });
                    }
                    if (e.key === "Backspace" && line === "" && lines.length > 1) {
                      e.preventDefault();
                      const updated = lines.filter((_, idx) => idx !== i);
                      save({ content: updated.join("\n") });
                    }
                  }}
                  placeholder="Item..."
                  className={`${inputBase} flex-1 leading-relaxed`}
                />
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return null;
}

const ADD_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "heading", label: "Heading", icon: <LuHeading1 size={14} /> },
  { type: "subheading", label: "Subheading", icon: <LuHeading2 size={14} /> },
  { type: "paragraph", label: "Paragraph", icon: <LuAlignLeft size={14} /> },
  { type: "checkbox", label: "Checkbox", icon: <LuSquareCheck size={14} /> },
  { type: "bullet", label: "Bullet List", icon: <LuList size={14} /> },
  { type: "numbered", label: "Numbered List", icon: <LuListOrdered size={14} /> },
];

export default function NoteView({ noteId, noteTitle, onBack }: NoteViewProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchDragState = useRef<{ fromIndex: number; currentOverIndex: number | null }>({
    fromIndex: -1,
    currentOverIndex: null,
  });
  const pagesLengthRef = useRef(0);
  const { setFooterContent } = useFooterContent();

  useEffect(() => {
    setLoading(true);
    fetchPages(noteId)
      .then(setPages)
      .finally(() => setLoading(false));
  }, [noteId]);

  const doReorder = useCallback((from: number, to: number) => {
    if (from === to) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const updated = next.map((p, i) => ({ ...p, order: i }));
      void Promise.all(updated.map((p) => updatePage(p.id, { order: p.order })));
      return updated;
    });
  }, []);

  const startTouchDrag = useCallback(
    (index: number) => {
      touchDragState.current = { fromIndex: index, currentOverIndex: null };
      setDragIndex(index);

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        for (let i = 0; i < blockRefs.current.length; i++) {
          const el = blockRefs.current[i];
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
        if (fromIndex !== -1 && currentOverIndex !== null && fromIndex !== currentOverIndex) {
          doReorder(fromIndex, currentOverIndex);
        }
        setDragIndex(null);
        setDragOverIndex(null);
        touchDragState.current = { fromIndex: -1, currentOverIndex: null };
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [doReorder],
  );

  const handleAddBlock = useCallback(async (type: BlockType) => {
    const page = await createPage(noteId, type, pagesLengthRef.current);
    setPages((prev) => {
      pagesLengthRef.current = prev.length + 1;
      return [...prev, page];
    });
  }, [noteId]);

  useEffect(() => {
    pagesLengthRef.current = pages.length;
  }, [pages.length]);

  useEffect(() => {
    setFooterContent(
      <div className="flex flex-wrap gap-2">
        {ADD_BLOCKS.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleAddBlock(type)}
            className="flex items-center gap-1.5 rounded-lg border border-mauve/20 bg-mauve/10 px-3 py-1.5 text-xs font-medium text-eggplant/70 transition-colors hover:bg-mauve/20 hover:text-eggplant dark:text-frost/70 dark:hover:text-frost"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>,
    );
    return () => setFooterContent(null);
  }, [noteId, handleAddBlock, setFooterContent]);

  const handleDeleteBlock = async (id: string) => {
    await deletePage(id);
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleChange = (
    id: string,
    fields: { title?: string; content?: string; checked?: boolean },
  ) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-mauve/25 bg-mauve/15 px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:bg-mauve/30 dark:text-frost"
        >
          <LuArrowLeft size={14} />
          Notes
        </button>
        <h2 className="text-3xl font-bold text-eggplant dark:text-frost">{noteTitle}</h2>
      </div>

      {loading ? (
        <div className="text-sm text-mauve">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {pages.length === 0 && (
            <div className="py-10 text-center text-sm text-mauve">No blocks yet. Add one below.</div>
          )}
          {pages.map((page, i) => (
            <div key={page.id} ref={(el) => { blockRefs.current[i] = el; }}>
              <BlockArticle
                page={page}
                onDelete={() => handleDeleteBlock(page.id)}
                onChange={(fields) => handleChange(page.id, fields)}
                onAddCheckbox={() => handleAddBlock("checkbox")}
                isDragging={dragIndex === i}
                isDragOver={dragOverIndex === i && dragIndex !== null && dragIndex !== i}
                onDragStart={() => setDragIndex(i)}
                onDragOver={() => { if (dragOverIndex !== i) setDragOverIndex(i); }}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i) doReorder(dragIndex, i);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onTouchStart={() => startTouchDrag(i)}
              />
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
