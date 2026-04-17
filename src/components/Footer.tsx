import { useFooterContent } from "../context/footerContent";

export default function Footer() {
  const { footerContent } = useFooterContent();
  if (!footerContent) return null;
  return (
    <footer className="border-t border-mauve/20 bg-blush/10 px-4 py-2.5 dark:border-mauve/15 dark:bg-[#2d2238]/60">
      {footerContent}
    </footer>
  );
}
