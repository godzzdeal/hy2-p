import { Monitor, Moon, Sun } from "@/components/elements/icons";

export const THEME_OPTIONS = [
  { value: "system", label: "Системная", icon: Monitor },
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
] as const;

export type TThemeOption = (typeof THEME_OPTIONS)[number];
