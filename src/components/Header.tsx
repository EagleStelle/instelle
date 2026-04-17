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
          className="flex items-center gap-2 rounded-lg border border-mauve/40 bg-frost/10 px-3 py-1.5 text-sm font-medium text-frost/80 transition-colors hover:bg-frost/20 hover:text-frost"
          aria-label="Toggle theme"
        >
          {isDark ? <LuSun size={15} /> : <LuMoon size={15} />}
          {isDark ? "Light" : "Dark"}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg border border-petal/25 bg-petal/10 px-3 py-1.5 text-sm font-medium text-petal/80 transition-colors hover:bg-petal/20 hover:text-petal"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
