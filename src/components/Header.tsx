import { LuSun, LuMoon } from "react-icons/lu";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export default function Header({ isDark, onToggleTheme, onSignOut }: HeaderProps) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-mauve/30 bg-eggplant px-6 py-4">
      <h1 className="m-0 text-2xl font-bold tracking-wide text-frost">
        Instelle
      </h1>
      <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleTheme}
        className="flex items-center gap-2 rounded-xl border border-mauve/50 px-3 py-1.5 text-sm font-medium text-frost/80 transition-colors hover:border-mauve hover:text-frost"
        aria-label="Toggle theme"
      >
        {isDark ? <LuSun size={15} /> : <LuMoon size={15} />}
        {isDark ? "Light" : "Dark"}
      </button>
      <button
        type="button"
        onClick={onSignOut}
        className="rounded-xl border border-petal/20 px-3 py-1.5 text-sm font-medium text-petal/70 transition-colors hover:border-petal/40 hover:bg-petal/10 hover:text-petal"
      >
        Sign out
      </button>
      </div>
    </header>
  );
}
