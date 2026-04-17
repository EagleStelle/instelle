import { useFooterContent } from "../context/footerContent";

export default function Footer() {
  const { footerContent } = useFooterContent();
  if (!footerContent) return null;
  return (
    <footer className="border-t border-eggplant/25 bg-[#4a355a] px-4 py-3 dark:border-mauve/30 dark:bg-[#261933]">
      {footerContent}
    </footer>
  );
}
