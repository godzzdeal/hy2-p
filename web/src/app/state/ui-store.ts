import { create } from "zustand";
import { type TPage } from "@/app/navigation";
interface IUiState {
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
  page: TPage;
  error: string;
  notice: string;
  selectPage: (page: TPage) => void;
  showError: (error: unknown) => void;
  notify: (notice: string) => void;
  clearError: () => void;
  clearNotice: () => void;
}
export const useUiStore = create<IUiState>((set) => ({
  theme: "system",
  setTheme: (theme) => set({ theme }),
  page: "overview",
  error: "",
  notice: "",
  selectPage: (page) => set({ page, error: "" }),
  showError: (error) => set({ error: error instanceof Error ? error.message : "Произошла ошибка" }),
  notify: (notice) => set({ notice }),
  clearError: () => set({ error: "" }),
  clearNotice: () => set({ notice: "" }),
}));
