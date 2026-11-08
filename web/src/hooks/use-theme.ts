import { useUiStore } from "@/store/ui-store";
import { useEffect } from "react";
export function useTheme() {
  const theme = useUiStore((state) => state.theme);
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    function applyTheme() {
      if (theme === "system") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = theme;
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta)
        meta.content = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    }
    applyTheme();
    system.addEventListener("change", applyTheme);
    return () => system.removeEventListener("change", applyTheme);
  }, [theme]);
}
