import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib";
import type { IScrollSection } from "./use-scroll-sections";
interface IScrollPoint {
  section: IScrollSection;
  isActive: boolean;
}
export function ScrollPoint({ section, isActive }: IScrollPoint) {
  const { t } = useTranslation();
  function onSelect() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(section.id)
      ?.scrollIntoView({ block: "start", behavior: reduced ? "instant" : "smooth" });
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
