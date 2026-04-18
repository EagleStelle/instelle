import { useEffect, useRef, useState } from "react";
import { LuCheck, LuX } from "react-icons/lu";

interface ModalProps {
  title: string;
  description?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  requiredValue?: string;
  maxLength?: number;
  danger?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function Modal({
  title,
  description,
  initialValue = "",
  placeholder = "Name...",
  confirmLabel = "Confirm",
  requiredValue,
  maxLength = 30,
  danger = false,
  onConfirm,
  onCancel,
}: ModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const isValid = requiredValue
    ? value.trim().toLowerCase() === requiredValue.toLowerCase()
    : value.trim().length > 0;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid) onConfirm(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-eggplant"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-mauve bg-frost p-6 dark:bg-mauve"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-eggplant">{title}</h3>
        {description && (
          <p className="mb-4 text-sm text-mauve dark:text-eggplant">
            {description}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full rounded-xl border border-mauve bg-white px-4 py-2 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!isValid}
              aria-label={confirmLabel}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${danger ? "bg-red-600 text-frost hover:bg-red-700 disabled:bg-red-300" : "bg-mauve text-eggplant hover:bg-eggplant hover:text-frost disabled:bg-blush disabled:text-eggplant"}`}
            >
              <LuCheck size={14} />
              <span className="hidden md:inline">{confirmLabel}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-mauve py-2 text-sm font-medium text-eggplant transition-colors hover:bg-petal dark:hover:bg-blush"
            >
              <LuX size={14} />
              <span className="hidden md:inline">Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
