import { create } from "zustand";
import { useNotifications } from "@/store/notifications";
const SETTINGS_PREFIX = "hy2.settings-section.v2.";
export const CLOSED_SECTION = { isOpen: false, hasOpened: false };
type TSettingsSections = Record<string, typeof CLOSED_SECTION>;

function readSettingsSections(): TSettingsSections {
  const sections: TSettingsSections = {};
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(SETTINGS_PREFIX)) continue;
      const isOpen = localStorage.getItem(key) === "open";
      sections[key.slice(SETTINGS_PREFIX.length)] = { isOpen, hasOpened: isOpen };
    }
  } catch {
    // Preferences remain usable without browser storage, including during SSR.
  }
  return sections;
}
interface IUiState {
  settingsSections: TSettingsSections;
  setSettingsSection: (id: string, isOpen: boolean) => void;
  isPanelRestarting: boolean;
  setPanelRestarting: (isPanelRestarting: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  hasUnsavedConfiguration: boolean;
  setConfigurationDirty: (isDirty: boolean) => void;
  showError: (error: unknown) => void;
  notify: (notice: string) => void;
}
export const useUiStore = create<IUiState>((set, get) => ({
  settingsSections: readSettingsSections(),
  setSettingsSection: (id, isOpen) => {
    const sections = get().settingsSections;
    set({
      settingsSections: {
        ...sections,
        [id]: { isOpen, hasOpened: isOpen || sections[id]?.hasOpened === true },
      },
    });
    try {
      localStorage.setItem(SETTINGS_PREFIX + id, isOpen ? "open" : "closed");
    } catch {
      // Collapsing remains available when browser storage is disabled.
    }
  },
  isPanelRestarting: false,
  setPanelRestarting: (isPanelRestarting) => set({ isPanelRestarting }),
  isSidebarCollapsed:
    typeof window !== "undefined" && localStorage.getItem("hy2.sidebar-collapsed") === "true",
  toggleSidebar: () => {
    const isSidebarCollapsed = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed });
    localStorage.setItem("hy2.sidebar-collapsed", String(isSidebarCollapsed));
  },
  hasUnsavedConfiguration: false,
  setConfigurationDirty: (isDirty) => set({ hasUnsavedConfiguration: isDirty }),
  showError: (error) => {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Произошла ошибка";
    useNotifications.getState().push(message, true);
  },
  notify: (notice) => {
    useNotifications.getState().push(notice);
  },
}));
