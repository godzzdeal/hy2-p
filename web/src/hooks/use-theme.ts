import { useTheme as useNextTheme } from "next-themes";
import { useEffect } from "react";
export function useTheme() {
  const { resolvedTheme } = useNextTheme();
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta)
      meta.content = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  }, [resolvedTheme]);
}
