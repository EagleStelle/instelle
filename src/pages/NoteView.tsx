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
import {
  createPage,
  deletePage,
  fetchPages,
  updatePage,
} from "../services/pages";
import { useFooterContent } from "../context/footerContent";

interface NoteViewProps {
  noteId: string;
  noteTitle: string;
  onBack: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterDraftActions?: (
    actions: { save: () => Promise<boolean>; discard: () => void } | null,
  ) => void;
}

interface CheckboxItem {
  title: string;
  checked: boolean;
}

const CHECKBOX_CONTENT_PREFIX = "__checkbox_items__:";

function clonePages(pages: Page[]): Page[] {
  return pages.map((page) => ({ ...page }));
}

function parseCheckboxItems(
  page: Pick<Page, "title" | "content" | "checked">,
): CheckboxItem[] {
  const fallbackTitle =
    page.title ||
    (page.content && !page.content.startsWith(CHECKBOX_CONTENT_PREFIX)
      ? page.content
      : "");

  const firstItem: CheckboxItem = {
    title: fallbackTitle,
    checked: Boolean(page.checked),
  };

  if (!page.content || !page.content.startsWith(CHECKBOX_CONTENT_PREFIX)) {
    return [firstItem];
  }

  try {
    const raw = JSON.parse(page.content.slice(CHECKBOX_CONTENT_PREFIX.length));
    if (!Array.isArray(raw)) return [firstItem];
    const extras = raw
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item) => ({
        title: typeof item.title === "string" ? item.title : "",
        checked: Boolean(item.checked),
      }));
    return [firstItem, ...extras];
  } catch {
    return [firstItem];
  }
}

function toCheckboxFields(items: CheckboxItem[]): {
  title: string;
  content: string;
  checked: boolean;
} {
  const normalized = items.length > 0 ? items : [{ title: "", checked: false }];
  const [first, ...rest] = normalized;
  return {
    title: first.title,
    checked: first.checked,
    content:
      rest.length > 0
        ? `${CHECKBOX_CONTENT_PREFIX}${JSON.stringify(rest)}`
        : "",
  };
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
  "absolute right-8 top-2 rounded-lg p-1 text-mauve/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-mauve/10 hover:text-mauve";

function BlockArticle({
  page,
  onDelete,
  onChange,
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
  onChange: (fields: {
    title?: string;
    content?: string;
    checked?: boolean;
  }) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  onTouchStart?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const updateFields = (fields: {
    title?: string;
    content?: string;
    checked?: boolean;
  }) => {
    onChange(fields);
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
      <button
        type="button"
        onClick={onDelete}
        className={deleteBtn}
        aria-label="Delete block"
      >
        <LuTrash2 size={12} />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className={copyBtn}
        aria-label="Copy block"
      >
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
            onChange={(e) => updateFields({ title: e.target.value })}
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
            onChange={(e) => updateFields({ title: e.target.value })}
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
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <AutoTextarea
            value={page.content}
            onChange={(e) => updateFields({ content: e.target.value })}
            placeholder="Write something..."
            className={`${inputBase} min-h-6 text-sm leading-6 text-eggplant/80 dark:text-frost/80`}
          />
        </div>
      </article>
    );
  }

  if (page.block_type === "checkbox") {
    const items = parseCheckboxItems(page);

    const updateItems = (nextItems: CheckboxItem[]) => {
      updateFields(toCheckboxFields(nextItems));
    };

    return (
      <article {...articleHandlers}>
        {dragHandle}
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = { ...item, checked: e.target.checked };
                    updateItems(updated);
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-mauve"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = { ...item, title: e.target.value };
                    updateItems(updated);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const updated = [...items];
                      updated.splice(i + 1, 0, { title: "", checked: false });
                      updateItems(updated);
                    }
                    if (
                      e.key === "Backspace" &&
                      item.title === "" &&
                      items.length > 1
                    ) {
                      e.preventDefault();
                      const updated = items.filter((_, idx) => idx !== i);
                      updateItems(updated);
                    }
                  }}
                  placeholder="Task..."
                  className={`${inputBase} text-sm font-medium text-eggplant dark:text-frost ${item.checked ? "line-through opacity-50" : ""}`}
                />
              </div>
            ))}
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
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => updateFields({ title: e.target.value })}
            placeholder="List title (optional)..."
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-frost`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80"
              >
                <span className="mt-0.5 shrink-0 text-mauve">•</span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => {
                    const updated = [...lines];
                    updated[i] = e.target.value;
                    updateFields({ content: updated.join("\n") });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const updated = [...lines];
                      updated.splice(i + 1, 0, "");
                      updateFields({ content: updated.join("\n") });
                    }
                    if (
                      e.key === "Backspace" &&
                      line === "" &&
                      lines.length > 1
                    ) {
                      e.preventDefault();
                      const updated = lines.filter((_, idx) => idx !== i);
                      updateFields({ content: updated.join("\n") });
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
        <div className="relative min-w-0 flex-1 p-3 pr-8">
          {actionBtns}
          <input
            type="text"
            value={page.title}
            onChange={(e) => updateFields({ title: e.target.value })}
            placeholder="List title (optional)..."
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-frost`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80"
              >
                <span className="mt-0.5 min-w-5 shrink-0 text-right text-mauve">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => {
                    const updated = [...lines];
                    updated[i] = e.target.value;
                    updateFields({ content: updated.join("\n") });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const updated = [...lines];
                      updated.splice(i + 1, 0, "");
                      updateFields({ content: updated.join("\n") });
                    }
                    if (
                      e.key === "Backspace" &&
                      line === "" &&
                      lines.length > 1
                    ) {
                      e.preventDefault();
                      const updated = lines.filter((_, idx) => idx !== i);
                      updateFields({ content: updated.join("\n") });
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

const ADD_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] =
  [
    { type: "heading", label: "Heading", icon: <LuHeading1 size={14} /> },
    { type: "subheading", label: "Subheading", icon: <LuHeading2 size={14} /> },
    { type: "paragraph", label: "Paragraph", icon: <LuAlignLeft size={14} /> },
    { type: "checkbox", label: "Checkbox", icon: <LuSquareCheck size={14} /> },
    { type: "bullet", label: "Bullet List", icon: <LuList size={14} /> },
    {
      type: "numbered",
      label: "Numbered List",
      icon: <LuListOrdered size={14} />,
    },
  ];

export default function NoteView({
  noteId,
  noteTitle,
  onBack,
  onDirtyChange,
  onRegisterDraftActions,
}: NoteViewProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirtyPageIds, setDirtyPageIds] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchDragState = useRef<{
    fromIndex: number;
    currentOverIndex: number | null;
  }>({
    fromIndex: -1,
    currentOverIndex: null,
  });
  const pagesLengthRef = useRef(0);
  const savedPagesRef = useRef<Page[]>([]);
  const { setFooterContent } = useFooterContent();

  const hasUnsavedChanges = dirtyPageIds.size > 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSaveError(null);
    fetchPages(noteId)
      .then((data) => {
        if (cancelled) return;
        setPages(data);
        savedPagesRef.current = clonePages(data);
        setDirtyPageIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const discardChanges = useCallback(() => {
    setPages(clonePages(savedPagesRef.current));
    setDirtyPageIds(new Set());
    setSaveError(null);
  }, []);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (saving) return false;
    if (dirtyPageIds.size === 0) return true;

    setSaving(true);
    setSaveError(null);

    try {
      const dirtyPages = pages.filter((page) => dirtyPageIds.has(page.id));
      await Promise.all(
        dirtyPages.map((page) =>
          updatePage(page.id, {
            title: page.title,
            content: page.content,
            checked: page.checked,
            order: page.order,
          }),
        ),
      );
      savedPagesRef.current = clonePages(pages);
      setDirtyPageIds(new Set());
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save changes.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [dirtyPageIds, pages, saving]);

  useEffect(() => {
    onRegisterDraftActions?.({ save: saveChanges, discard: discardChanges });
    return () => onRegisterDraftActions?.(null);
  }, [discardChanges, onRegisterDraftActions, saveChanges]);

  const doReorder = useCallback((from: number, to: number) => {
    if (from === to) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const updated = next.map((p, i) => ({ ...p, order: i }));
      setDirtyPageIds((prevDirty) => {
        const nextDirty = new Set(prevDirty);
        updated.forEach((p) => nextDirty.add(p.id));
        return nextDirty;
      });
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
        if (
          fromIndex !== -1 &&
          currentOverIndex !== null &&
          fromIndex !== currentOverIndex
        ) {
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

  const handleAddBlock = useCallback(
    async (type: BlockType) => {
      const page = await createPage(noteId, type, pagesLengthRef.current);
      setPages((prev) => {
        const next = [...prev, page];
        pagesLengthRef.current = next.length;
        return next;
      });
      savedPagesRef.current = [...savedPagesRef.current, { ...page }];
    },
    [noteId],
  );

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
            className="flex items-center gap-1.5 rounded-lg border border-frost/55 bg-frost/90 px-3 py-1.5 text-xs font-semibold text-eggplant shadow-sm transition-colors hover:bg-petal dark:border-mauve/45 dark:bg-frost/10 dark:text-frost dark:hover:bg-frost/20"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>,
    );
    return () => setFooterContent(null);
  }, [handleAddBlock, setFooterContent]);

  const handleDeleteBlock = async (id: string) => {
    await deletePage(id);
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      pagesLengthRef.current = next.length;
      return next;
    });
    savedPagesRef.current = savedPagesRef.current.filter((p) => p.id !== id);
    setDirtyPageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleChange = (
    id: string,
    fields: { title?: string; content?: string; checked?: boolean },
  ) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields } : p)),
    );
    setDirtyPageIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-mauve/25 bg-mauve/15 px-3 py-1.5 text-sm font-medium text-eggplant transition-colors hover:bg-mauve/30 dark:text-frost"
          >
            <LuArrowLeft size={14} />
            Notes
          </button>
          <h2 className="truncate text-3xl font-bold text-eggplant dark:text-frost">
            {noteTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && !saveError && (
            <span className="text-xs font-medium text-mauve">
              Unsaved changes
            </span>
          )}
          {saveError && (
            <span
              className="max-w-52 truncate text-xs font-medium text-red-500"
              title={saveError}
            >
              {saveError}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              void saveChanges();
            }}
            disabled={!hasUnsavedChanges || saving}
            className="rounded-lg border border-mauve/40 bg-mauve px-3 py-1.5 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-mauve">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {pages.length === 0 && (
            <div className="py-10 text-center text-sm text-mauve">
              No blocks yet. Add one below.
            </div>
          )}
          {pages.map((page, i) => (
            <div
              key={page.id}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
            >
              <BlockArticle
                page={page}
                onDelete={() => handleDeleteBlock(page.id)}
                onChange={(fields) => handleChange(page.id, fields)}
                isDragging={dragIndex === i}
                isDragOver={
                  dragOverIndex === i && dragIndex !== null && dragIndex !== i
                }
                onDragStart={() => setDragIndex(i)}
                onDragOver={() => {
                  if (dragOverIndex !== i) setDragOverIndex(i);
                }}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== i)
                    doReorder(dragIndex, i);
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
