import { useState } from "react";

const STORAGE_PREFIX = "hy2.settings-section.v2.";

export function useSettingsSection(id: string) {
  const key = STORAGE_PREFIX + id;
  const [isOpen, setOpen] = useState(() => {
    try {
      return localStorage.getItem(key) === "open";
    } catch {
      return false;
    }
  });
  function onToggle() {
    const next = !isOpen;
    setOpen(next);
    try {
      localStorage.setItem(key, next ? "open" : "closed");
    } catch {
      // Collapsing remains available when browser storage is disabled.
    }
  }
  return { isOpen, onToggle };
}
