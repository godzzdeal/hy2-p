import { ScrollPoint } from "@/components/layout/scroll/ScrollPoint";
import { useScrollSections } from "@/hooks/layout/scroll/use-scroll-sections";
import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
export function ScrollNavigation({ root, page }: { root: RefObject<HTMLDivElement | null>; page: string }) {
  const { t } = useTranslation();
  const { sections, active } = useScrollSections(root, page);
  if (sections.length < 2) return null;
  return (
    <nav
      className="scroll-navigation shadow-pixel rounded-none fixed -translate-y-1/2 z-10 flex flex-col gap-0 p-1 m-0 overflow-visible border border-line bg-surface max-tablet:hidden max-tablet:static max-tablet:transform-none max-tablet:translate-y-0 max-tablet:self-center max-tablet:shrink-0 max-tablet:my-2 max-tablet:mx-4 max-tablet:flex-row"
      aria-label={t("Блоки страницы")}
    >
      {sections.map((section) => (
        <ScrollPoint key={section.id} section={section} isActive={section.id === active} />
      ))}
    </nav>
  );
}
