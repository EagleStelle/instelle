import { useEffect, useRef, useState } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-eggplant/40 backdrop-blur-sm dark:bg-eggplant/60"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-mauve/20 bg-frost p-6 dark:border-mauve/20 dark:bg-[#2d2238]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-eggplant dark:text-frost">
          {title}
        </h3>
        {description && (
          <p className="mb-4 text-sm text-mauve dark:text-mauve/80">
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
            className="w-full rounded-xl border border-mauve/30 bg-white px-4 py-2 text-sm text-eggplant outline-none focus:border-mauve dark:border-mauve/20 dark:bg-eggplant dark:text-frost dark:focus:border-mauve"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold text-frost transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-mauve hover:bg-eggplant"}`}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-mauve/30 py-2 text-sm font-medium text-eggplant transition-colors hover:border-mauve/60 dark:text-frost dark:hover:border-mauve/60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
