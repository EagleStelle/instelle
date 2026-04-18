import { LuLogOut, LuMenu, LuMoon, LuSearch, LuSettings, LuSun, LuX } from "react-icons/lu";

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onOpenGlobalSearch: () => void;
}

const btn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-frost bg-mauve text-eggplant transition-colors hover:bg-eggplant hover:border-frost hover:text-frost md:w-auto md:gap-2 md:px-3";

export default function Header({
  isDark,
  onToggleTheme,
  onOpenSettings,
  onSignOut,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onOpenGlobalSearch,
}: HeaderProps) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-mauve bg-eggplant px-6 py-4">
      <h1 className="m-0 text-2xl font-bold tracking-wide text-frost">
        Instelle
      </h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className={`${btn} md:hidden`}
          aria-label={isMobileSidebarOpen ? "Hide notebooks" : "Show notebooks"}
        >
          {isMobileSidebarOpen ? <LuX size={15} className="shrink-0" /> : <LuMenu size={15} className="shrink-0" />}
        </button>
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className={btn}
          aria-label="Global search"
          title="Search (Ctrl+K)"
        >
          <LuSearch size={15} className="shrink-0" />
          <span className="hidden md:inline">Search</span>
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className={btn}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <LuSun size={15} className="shrink-0" /> : <LuMoon size={15} className="shrink-0" />}
          <span className="hidden md:inline">{isDark ? "Light" : "Dark"}</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className={btn}
          aria-label="Open settings"
        >
          <LuSettings size={15} className="shrink-0" />
          <span className="hidden md:inline">Settings</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-blush bg-petal text-eggplant transition-colors hover:bg-blush hover:border-mauve hover:text-eggplant md:w-auto md:gap-2 md:px-3"
        >
          <LuLogOut size={15} className="shrink-0" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
