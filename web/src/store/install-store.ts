import { create } from "zustand";
export interface IInstallPrompt extends Event {
  prompt: () => Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}
interface IInstallState {
  prompt: IInstallPrompt | null;
  isInstalled: boolean;
  setPrompt: (prompt: IInstallPrompt | null) => void;
  setInstalled: (isInstalled: boolean) => void;
}
export const useInstallStore = create<IInstallState>((set) => ({
  prompt: null,
  isInstalled: false,
  setPrompt: (prompt) => set({ prompt }),
  setInstalled: (isInstalled) => set({ isInstalled, prompt: null }),
}));
