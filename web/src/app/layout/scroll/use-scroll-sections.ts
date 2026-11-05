import { useEffect, useState } from "react";
import { type RefObject } from "react";
export interface IScrollSection {
  id: string;
  label: string;
}
const ACTIVE_VIEWPORT_RATIO = 0.25;
const SCROLL_EDGE_TOLERANCE = 4;
export function useScrollSections(root: RefObject<HTMLDivElement | null>, page: string) {
  const [sections, setSections] = useState<IScrollSection[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const content = root.current;
    if (!content) return;
    let targets: HTMLElement[] = [];
    let frame = 0;
    function updateActive() {
      frame = 0;
      let current: HTMLElement | undefined = targets[0];
      const line = window.innerHeight * ACTIVE_VIEWPORT_RATIO;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target;
      }
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - SCROLL_EDGE_TOLERANCE;
      if (atBottom && document.documentElement.scrollHeight > window.innerHeight + SCROLL_EDGE_TOLERANCE)
        current = targets.at(-1);
      setActive(current?.id ?? "");
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateActive);
    }
    function collect() {
      targets = Array.from(content!.querySelectorAll<HTMLElement>("[data-scroll-section]"));
      const next = targets.map((target) => ({
        id: target.id,
        label: target.dataset.scrollLabel ?? target.id,
      }));
      setSections((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
      scheduleUpdate();
    }
    const observer = new MutationObserver(collect);
    observer.observe(content, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-scroll-label"],
    });
    collect();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [root, page]);
  return { sections, active };
}
