import { i18n } from "@/config/i18n/setup";
import { type TPage } from "@/config/navigation";
import { create } from "zustand";
import { useNotifications } from "@/store/notifications";
interface IUiState {
  isPanelRestarting: boolean;
  setPanelRestarting: (isPanelRestarting: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
  page: TPage;
  hasUnsavedConfiguration: boolean;
  setConfigurationDirty: (isDirty: boolean) => void;
  selectPage: (page: TPage) => void;
  showError: (error: unknown) => void;
  notify: (notice: string) => void;
}
export const useUiStore = create<IUiState>((set, get) => ({
  isPanelRestarting: false,
  setPanelRestarting: (isPanelRestarting) => set({ isPanelRestarting }),
  isSidebarCollapsed: localStorage.getItem("hy2.sidebar-collapsed") === "true",
  toggleSidebar: () => {
    const isSidebarCollapsed = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed });
    localStorage.setItem("hy2.sidebar-collapsed", String(isSidebarCollapsed));
  },
  theme: "system",
  setTheme: (theme) => set({ theme }),
  page: "overview",
  hasUnsavedConfiguration: false,
  setConfigurationDirty: (isDirty) => set({ hasUnsavedConfiguration: isDirty }),
  selectPage: (page) => {
    if (
      page !== get().page &&
      get().hasUnsavedConfiguration &&
      !window.confirm(i18n.t("Есть несохранённые изменения. Уйти без сохранения?"))
    )
      return;
    set({ page });
  },
  showError: (error) => {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Произошла ошибка";
    useNotifications.getState().push(message, true);
  },
  notify: (notice) => {
    useNotifications.getState().push(notice);
  },
}));
