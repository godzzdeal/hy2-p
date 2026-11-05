import { i18n } from "@/shared/i18n/setup";
import { create } from "zustand";
import { type TPage } from "@/app/navigation";
interface IUiState {
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
  page: TPage;
  hasUnsavedConfiguration: boolean;
  setConfigurationDirty: (isDirty: boolean) => void;
  error: string;
  notice: string;
  selectPage: (page: TPage) => void;
  showError: (error: unknown) => void;
  notify: (notice: string) => void;
  clearError: () => void;
  clearNotice: () => void;
}
export const useUiStore = create<IUiState>((set, get) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
  page: "overview",
  hasUnsavedConfiguration: false,
  setConfigurationDirty: (isDirty) => set({ hasUnsavedConfiguration: isDirty }),
  error: "",
  notice: "",
  selectPage: (page) => {
    if (
      page !== get().page &&
      get().hasUnsavedConfiguration &&
      !window.confirm(i18n.t("Есть несохранённые изменения. Уйти без сохранения?"))
    )
      return;
    set({ page, error: "" });
  },
  showError: (error) => set({ error: error instanceof Error ? error.message : "Произошла ошибка" }),
  notify: (notice) => set({ notice }),
  clearError: () => set({ error: "" }),
  clearNotice: () => set({ notice: "" }),
}));
