import { useState } from "react";

const STORAGE_PREFIX = "hy2.settings-section.v2.";

export function useSettingsSection(id: string) {
  const key = STORAGE_PREFIX + id;
  const [state, setState] = useState(() => {
    try {
      const isOpen = localStorage.getItem(key) === "open";
      return { isOpen, hasOpened: isOpen };
    } catch {
      return { isOpen: false, hasOpened: false };
    }
  });
  function onToggle() {
    const next = !state.isOpen;
    setState({ isOpen: next, hasOpened: state.hasOpened || next });
    try {
      localStorage.setItem(key, next ? "open" : "closed");
    } catch {
      // Collapsing remains available when browser storage is disabled.
    }
  }
  return { ...state, onToggle };
}
