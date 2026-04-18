import { useFooterContent } from "../context/footerContent";

export default function Footer() {
  const { footerContent } = useFooterContent();
  if (!footerContent) return null;
  return (
    <footer className="border-t-2 border-blush bg-white px-4 py-3 dark:border-orchid dark:bg-plum">
      {footerContent}
    </footer>
  );
}
