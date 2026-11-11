import { CLOSED_SECTION, useUiStore } from "@/store/ui-store";

export function useSettingsSection(id: string) {
  const state = useUiStore((value) => value.settingsSections[id] ?? CLOSED_SECTION);
  const setSettingsSection = useUiStore((value) => value.setSettingsSection);
  function onToggle() {
    setSettingsSection(id, !state.isOpen);
  }
  return { ...state, onToggle };
}
