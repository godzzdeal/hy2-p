import { useUiStore } from "@/store/ui-store";

export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  const content = target?.closest<HTMLElement>("[data-page-content]");
  if (!target || !content) return;
  const scroll = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
    content.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  };
  if (target.hasAttribute("data-settings-section")) {
    useUiStore.getState().setSettingsSection(id, true);
    requestAnimationFrame(scroll);
  } else scroll();
}
