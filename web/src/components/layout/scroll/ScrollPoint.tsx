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
    const content = target?.closest<HTMLElement>(".content");
    if (!target || !content) return;
    const top = target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
    content.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  }
  return (
    <button
      type="button"
      className={cn("scroll-point", { "scroll-point-active": isActive })}
      title={section.label}
      aria-label={t("Перейти к разделу {{section}}", { section: section.label })}
      aria-controls={section.id}
      aria-current={isActive ? "location" : undefined}
      onClick={onSelect}
    >
      <span aria-hidden="true" />
      <span className="scroll-point-label">{section.label}</span>
    </button>
  );
}
