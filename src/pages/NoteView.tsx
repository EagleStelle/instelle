import { useEffect, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuTrash2,
  LuHeading1,
  LuHeading2,
  LuAlignLeft,
  LuSquareCheck,
  LuList,
  LuListOrdered,
} from "react-icons/lu";
import type { Page, BlockType } from "../types/database";
import { fetchPages, createPage, updatePage, deletePage } from "../services/pages";

interface NoteViewProps {
  noteId: string;
  noteTitle: string;
  onBack: () => void;
}

function BlockArticle({
  page,
  onDelete,
  onChange,
}: {
  page: Page;
  onDelete: () => void;
  onChange: (fields: { title?: string; content?: string; checked?: boolean }) => void;
}) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = (fields: { title?: string; content?: string; checked?: boolean }) => {
    onChange(fields);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void updatePage(page.id, fields);
    }, 800);
  };

  const baseArticle = "group relative rounded-2xl border border-mauve/15 bg-white p-5 dark:border-mauve/10 dark:bg-[#2d2238]";
  const deleteBtn =
    "absolute right-3 top-3 rounded-lg p-1 text-mauve/30 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100";
  const inputBase = "w-full bg-transparent outline-none placeholder:text-mauve/30 dark:placeholder:text-mauve/25";

  if (page.block_type === "heading") {
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        <input
          type="text"
          value={page.title}
          onChange={(e) => save({ title: e.target.value })}
          placeholder="Heading..."
          className={`${inputBase} text-3xl font-bold text-eggplant dark:text-frost`}
        />
      </article>
    );
  }

  if (page.block_type === "subheading") {
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        <input
          type="text"
          value={page.title}
          onChange={(e) => save({ title: e.target.value })}
          placeholder="Subheading..."
          className={`${inputBase} text-xl font-semibold text-eggplant dark:text-frost`}
        />
      </article>
    );
  }

  if (page.block_type === "paragraph") {
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        <textarea
          value={page.content}
          onChange={(e) => save({ content: e.target.value })}
          placeholder="Write something..."
          rows={4}
          className={`${inputBase} resize-none text-sm leading-relaxed text-eggplant/80 dark:text-frost/80`}
        />
      </article>
    );
  }

  if (page.block_type === "checkbox") {
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={page.checked}
            onChange={(e) => save({ checked: e.target.checked })}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-mauve cursor-pointer"
          />
          <div className="flex flex-1 flex-col gap-2">
            <input
              type="text"
              value={page.title}
              onChange={(e) => save({ title: e.target.value })}
              placeholder="Task..."
              className={`${inputBase} text-sm font-semibold text-eggplant dark:text-frost ${page.checked ? "line-through opacity-50" : ""}`}
            />
            <textarea
              value={page.content}
              onChange={(e) => save({ content: e.target.value })}
              placeholder="Notes..."
              rows={2}
              className={`${inputBase} resize-none text-sm leading-relaxed text-eggplant/70 dark:text-frost/70 ${page.checked ? "opacity-50" : ""}`}
            />
          </div>
        </div>
      </article>
    );
  }

  if (page.block_type === "bullet") {
    const lines = page.content.split("\n");
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        {page.title && (
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="List title..."
            className={`${inputBase} mb-3 text-sm font-semibold text-eggplant dark:text-frost`}
          />
        )}
        {!page.title && (
          <input
            type="text"
            value={page.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="List title (optional)..."
            className={`${inputBase} mb-3 text-sm font-semibold text-eggplant dark:text-frost`}
          />
        )}
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80">
              <span className="mt-0.5 flex-shrink-0 text-mauve">•</span>
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
      </article>
    );
  }

  if (page.block_type === "numbered") {
    const lines = page.content.split("\n");
    return (
      <article className={baseArticle}>
        <button type="button" onClick={onDelete} className={deleteBtn} aria-label="Delete block">
          <LuTrash2 size={13} />
        </button>
        <input
          type="text"
          value={page.title}
          onChange={(e) => save({ title: e.target.value })}
          placeholder="List title (optional)..."
          className={`${inputBase} mb-3 text-sm font-semibold text-eggplant dark:text-frost`}
        />
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-eggplant/80 dark:text-frost/80">
              <span className="mt-0.5 flex-shrink-0 min-w-[1.25rem] text-right text-mauve">{i + 1}.</span>
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

  useEffect(() => {
    setLoading(true);
    fetchPages(noteId)
      .then(setPages)
      .finally(() => setLoading(false));
  }, [noteId]);

  const handleAddBlock = async (type: BlockType) => {
    const page = await createPage(noteId, type, pages.length);
    setPages((prev) => [...prev, page]);
  };

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
          className="flex items-center gap-1.5 rounded-xl border border-mauve/20 px-3 py-1.5 text-sm text-mauve transition-colors hover:border-mauve/50 hover:text-eggplant dark:hover:text-frost"
        >
          <LuArrowLeft size={14} />
          Notes
        </button>
        <h2 className="text-xl font-bold text-eggplant dark:text-frost">{noteTitle}</h2>
      </div>

      {loading ? (
        <div className="text-sm text-mauve">Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {pages.length === 0 && (
            <div className="py-10 text-center text-sm text-mauve">No blocks yet. Add one below.</div>
          )}
          {pages.map((page) => (
            <BlockArticle
              key={page.id}
              page={page}
              onDelete={() => handleDeleteBlock(page.id)}
              onChange={(fields) => handleChange(page.id, fields)}
            />
          ))}

          <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-mauve/30 p-3">
            {ADD_BLOCKS.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleAddBlock(type)}
                className="flex items-center gap-1.5 rounded-xl border border-mauve/20 px-3 py-1.5 text-xs text-mauve transition-colors hover:border-mauve/50 hover:text-eggplant dark:hover:text-frost"
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
