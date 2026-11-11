import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { THEME_OPTIONS } from "./theme-options";

export function useThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const currentIndex = isMounted ? THEME_OPTIONS.findIndex((option) => option.value === theme) : 0;
  const current = THEME_OPTIONS[Math.max(currentIndex, 0)];
  const next = THEME_OPTIONS[(Math.max(currentIndex, 0) + 1) % THEME_OPTIONS.length];
  return { current, next, onSwitchTheme: () => setTheme(next.value) };
}
