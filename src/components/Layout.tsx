import type { PropsWithChildren } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type { SidebarProps } from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps extends PropsWithChildren, SidebarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export default function Layout({
  children,
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onAddNotebook,
  onRenameNotebook,
  onDeleteNotebook,
  isDark,
  onToggleTheme,
  onSignOut,
}: LayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-frost text-eggplant dark:bg-[#1e1428] dark:text-frost">
      <Header isDark={isDark} onToggleTheme={onToggleTheme} onSignOut={onSignOut} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar
          notebooks={notebooks}
          activeNotebookId={activeNotebookId}
          onSelectNotebook={onSelectNotebook}
          onAddNotebook={onAddNotebook}
          onRenameNotebook={onRenameNotebook}
          onDeleteNotebook={onDeleteNotebook}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <main
            className="min-w-0 flex-1 overflow-y-auto p-4 text-left sm:p-6"
            aria-label="Main content"
          >
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
