import { Button } from "@/components/ui/button/Button";
import { type IScrollSection } from "@/hooks/layout/scroll/use-scroll-sections";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
interface IScrollPoint {
  section: IScrollSection;
  isActive: boolean;
}
export function ScrollPoint({ section, isActive }: IScrollPoint) {
  const { t } = useTranslation();
  function onSelect() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = document.getElementById(section.id);
    const content = target?.closest<HTMLElement>("[data-page-content]");
    if (!target || !content) return;
    const top = target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
    content.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  }
  return (
    <Button
      type="button"
      className={cn("scroll-point group/point", { "scroll-point-active": isActive })}
      title={section.label}
      aria-label={t("Перейти к разделу {{section}}", { section: section.label })}
      aria-controls={section.id}
      aria-current={isActive ? "location" : undefined}
      onClick={onSelect}
    >
      <span aria-hidden="true" />
      <span className="scroll-point-label absolute py-2 px-3 border border-line rounded-none bg-surface text-lg whitespace-nowrap pointer-events-none translate-x-1 group-hover/point:translate-x-0 group-focus-visible/point:translate-x-0 max-tablet:hidden">
        {section.label}
      </span>
    </Button>
  );
}
