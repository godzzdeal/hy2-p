import { ScrollPoint } from "@/components/layout/scroll/ScrollPoint";
import { useScrollSections } from "@/hooks/layout/scroll/use-scroll-sections";
import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
export function ScrollNavigation({ root, page }: { root: RefObject<HTMLDivElement | null>; page: string }) {
  const { t } = useTranslation();
  const { sections, active } = useScrollSections(root, page);
  if (sections.length < 2) return null;
  return (
    <nav className="scroll-navigation" aria-label={t("Блоки страницы")}>
      {sections.map((section) => (
        <ScrollPoint key={section.id} section={section} isActive={section.id === active} />
      ))}
    </nav>
  );
}
