import { useEffect } from "react";
import { useUiStore } from "./ui-store";
export function useTheme() {
  const theme = useUiStore((state) => state.theme);
  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
}
