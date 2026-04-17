import { createContext, useContext, useState, type ReactNode } from "react";

interface FooterContentCtx {
  footerContent: ReactNode;
  setFooterContent: (node: ReactNode) => void;
}

const FooterContentContext = createContext<FooterContentCtx>({
  footerContent: null,
  setFooterContent: () => {},
});

export function FooterContentProvider({ children }: { children: ReactNode }) {
  const [footerContent, setFooterContent] = useState<ReactNode>(null);
  return (
    <FooterContentContext.Provider value={{ footerContent, setFooterContent }}>
      {children}
    </FooterContentContext.Provider>
  );
}

export const useFooterContent = () => useContext(FooterContentContext);
