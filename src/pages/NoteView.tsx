import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  LuSave,
  LuSearch,
  LuSquareCheck,
  LuTrash2,
  LuX,
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

function mergeRefs<T>(
  ...refs: (React.Ref<T> | null | undefined)[]
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

function clonePages(pages: Page[]): Page[] {
  return pages.map((page) => ({ ...page }));
}

function blockMatchesSearch(page: Page, query: string): boolean {
  const q = query.toLowerCase();
  return (
    page.title.toLowerCase().includes(q) ||
    page.content.toLowerCase().includes(q)
  );
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

interface AutoTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

const AutoTextarea = forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  function AutoTextarea(
    { value, onChange, onKeyDown, placeholder, className },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    }, [value]);

    return (
      <textarea
        ref={mergeRefs(innerRef, forwardedRef)}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        className={`overflow-hidden resize-none ${className ?? ""}`}
      />
    );
  },
);

const deleteBtn =
  "absolute right-2 top-2 rounded-lg border border-blush p-1 text-mauve transition-all hover:bg-petal hover:border-mauve hover:text-red-600 dark:border-plum dark:text-mauve dark:hover:border-orchid dark:hover:bg-void dark:hover:text-red-400";
const copyBtn =
  "absolute right-8 top-2 rounded-lg border border-blush p-1 text-mauve transition-all hover:bg-blush hover:border-mauve hover:text-eggplant dark:border-plum dark:text-mauve dark:hover:border-orchid dark:hover:bg-void dark:hover:text-petal";

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
  const checkboxInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const pendingCheckboxFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (page.block_type !== "checkbox") return;
    const nextIndex = pendingCheckboxFocusRef.current;
    if (nextIndex === null) return;

    pendingCheckboxFocusRef.current = null;
    const nextInput = checkboxInputRefs.current[nextIndex];
    if (!nextInput) return;

    nextInput.focus();
    const cursorPos = nextInput.value.length;
    nextInput.setSelectionRange(cursorPos, cursorPos);
  }, [page.block_type, page.content, page.title]);

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
    "w-full bg-transparent outline-none placeholder:text-mauve";

  const articleCls = [
    "group relative flex rounded-lg border-2 bg-white transition-all dark:bg-plum",
    isDragging ? "scale-[0.98] ring-2 ring-mauve dark:ring-orchid" : "",
    isDragOver
      ? "border-mauve bg-blush dark:border-orchid dark:bg-void"
      : "border-blush dark:border-orchid",
  ]
    .filter(Boolean)
    .join(" ");

  const dragHandle = (
    <div
      className="invisible flex w-5 shrink-0 cursor-grab items-center justify-center self-stretch text-mauve transition-colors group-hover:visible select-none touch-none active:cursor-grabbing dark:text-mauve dark:hover:text-blush"
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
            className={`${inputBase} min-h-6 text-sm leading-6 text-eggplant dark:text-frost`}
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
              <div key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = { ...item, checked: e.target.checked };
                    updateItems(updated);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-mauve"
                />
                <AutoTextarea
                  ref={(el) => {
                    checkboxInputRefs.current[i] = el;
                  }}
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
                      pendingCheckboxFocusRef.current = i + 1;
                      updateItems(updated);
                    }
                    if (
                      e.key === "Backspace" &&
                      e.shiftKey &&
                      items.length > 1
                    ) {
                      e.preventDefault();
                      const updated = items.filter((_, idx) => idx !== i);
                      pendingCheckboxFocusRef.current = Math.max(i - 1, 0);
                      updateItems(updated);
                    }
                  }}
                  placeholder="Task..."
                  className={`${inputBase} min-w-0 flex-1 text-sm font-medium leading-normal text-eggplant dark:text-frost ${item.checked ? "line-through text-mauve dark:text-mauve" : ""}`}
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
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-blush`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm"
              >
                <span className="mt-0.5 shrink-0 text-mauve dark:text-orchid">•</span>
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
                  className={`${inputBase} flex-1 leading-relaxed text-eggplant dark:text-frost`}
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
            className={`${inputBase} mb-2 text-sm font-semibold text-eggplant dark:text-blush`}
          />
          <div className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm"
              >
                <span className="mt-0.5 min-w-5 shrink-0 text-right text-mauve dark:text-orchid">
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
                  className={`${inputBase} flex-1 leading-relaxed text-eggplant dark:text-frost`}
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

const actionBtn =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 border-eggplant bg-blush px-3 text-sm font-semibold text-eggplant transition-colors hover:bg-mauve hover:border-eggplant hover:text-frost dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal";

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) void saveChanges();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges, saving, saveChanges, showSearch]);

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
            aria-label={label}
            onClick={() => handleAddBlock(type)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-eggplant bg-blush text-xs font-semibold text-eggplant transition-colors hover:border-eggplant hover:bg-mauve hover:text-frost md:w-auto md:gap-1.5 md:px-3 dark:border-petal dark:bg-orchid dark:text-frost dark:hover:border-petal dark:hover:bg-plum dark:hover:text-petal"
          >
            {icon}
            <span className="hidden md:inline">{label}</span>
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

  const matchCount = searchQuery
    ? pages.filter((p) => blockMatchesSearch(p, searchQuery)).length
    : 0;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-2 md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to notes"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-eggplant bg-blush text-sm font-medium text-eggplant transition-colors hover:bg-mauve hover:border-eggplant hover:text-frost md:w-auto md:gap-1.5 md:px-3 dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal"
          >
            <LuArrowLeft size={14} className="shrink-0" />
            <span className="hidden md:inline">Notes</span>
          </button>
          <h2 className="min-w-0 truncate text-2xl font-bold text-eggplant dark:text-frost sm:text-3xl">
            {noteTitle}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
              setShowSearch((s) => !s);
              if (!showSearch)
                setTimeout(() => searchInputRef.current?.focus(), 0);
              else setSearchQuery("");
            }}
            aria-label="Find in note"
            title="Find (Ctrl+F)"
            className={[
              "inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 text-sm font-semibold transition-colors md:w-auto md:px-3",
              showSearch
                ? "border-eggplant bg-eggplant text-frost dark:border-petal dark:bg-orchid dark:text-frost"
                : "border-eggplant bg-blush text-eggplant hover:bg-mauve hover:border-eggplant hover:text-frost dark:border-petal dark:bg-orchid dark:text-frost dark:hover:bg-plum dark:hover:border-petal dark:hover:text-petal",
            ].join(" ")}
          >
            <LuSearch size={14} className="shrink-0" />
            <span className="hidden md:inline">Find</span>
          </button>
          <button
            type="button"
            onClick={() => void saveChanges()}
            aria-label={saving ? "Saving changes" : "Save changes"}
            title="Save (Ctrl+S)"
            disabled={!hasUnsavedChanges || saving}
            className={`${actionBtn} w-9 md:w-auto disabled:cursor-not-allowed disabled:border-blush disabled:bg-blush disabled:text-mauve disabled:hover:bg-blush disabled:hover:border-blush disabled:hover:text-mauve dark:disabled:border-plum dark:disabled:bg-plum dark:disabled:text-mauve dark:disabled:hover:bg-plum dark:disabled:hover:border-plum dark:disabled:hover:text-mauve`}
          >
            <LuSave size={14} />
            <span className="hidden md:inline">
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border-2 border-blush bg-white px-3 py-2 dark:border-orchid dark:bg-plum">
          <LuSearch size={14} className="shrink-0 text-mauve dark:text-orchid" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks..."
            className="flex-1 bg-transparent text-sm text-eggplant outline-none placeholder:text-mauve dark:text-frost dark:placeholder:text-mauve"
          />
          {searchQuery && (
            <span className="shrink-0 text-xs text-mauve">
              {matchCount} match{matchCount !== 1 ? "es" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            className="shrink-0 rounded p-0.5 text-mauve transition-colors hover:text-eggplant dark:hover:text-petal"
            aria-label="Close search"
          >
            <LuX size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-mauve">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {pages.length === 0 && (
            <div className="py-10 text-center text-sm text-mauve">
              No blocks yet. Add one below.
            </div>
          )}
          {pages.map((page, i) => {
            const isMatch =
              showSearch &&
              searchQuery &&
              blockMatchesSearch(page, searchQuery);
            return (
              <div
                key={page.id}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                className={
                  isMatch ? "rounded-lg ring-2 ring-orchid" : undefined
                }
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
            );
          })}
        </div>
      )}
    </div>
  );
}
