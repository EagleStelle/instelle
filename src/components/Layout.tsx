import { useEffect, useState, type PropsWithChildren } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import type { SidebarProps } from "./Sidebar";
import Footer from "./Footer";
import { FooterContentProvider } from "../context/footerContent";

interface LayoutProps extends PropsWithChildren, SidebarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onOpenGlobalSearch: () => void;
}

export default function Layout({
  children,
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onAddNotebook,
  onRenameNotebook,
  onDeleteNotebook,
  onReorderNotebooks,
  isDark,
  onToggleTheme,
  onSignOut,
  onOpenGlobalSearch,
}: LayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectNotebook = (id: string) => {
    onSelectNotebook(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <FooterContentProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-frost text-eggplant dark:bg-void dark:text-frost">
        <Header
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onSignOut={onSignOut}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((open) => !open)}
          onOpenGlobalSearch={onOpenGlobalSearch}
        />
        <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
          {isMobileSidebarOpen && (
            <button
              type="button"
              aria-label="Close notebooks"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-eggplant/80 md:hidden"
            />
          )}
          <Sidebar
            notebooks={notebooks}
            activeNotebookId={activeNotebookId}
            onSelectNotebook={handleSelectNotebook}
            onAddNotebook={onAddNotebook}
            onRenameNotebook={onRenameNotebook}
            onDeleteNotebook={onDeleteNotebook}
            onReorderNotebooks={onReorderNotebooks}
            mobileOpen={isMobileSidebarOpen}
            onRequestCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-frost dark:bg-void">
            <main
              className="min-w-0 flex-1 overflow-y-auto bg-frost p-4 text-left text-eggplant sm:p-6 dark:bg-void dark:text-frost"
              aria-label="Main content"
            >
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </FooterContentProvider>
  );
}
