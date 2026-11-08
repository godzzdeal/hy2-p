import { DEFAULT_INSTANCE } from "@/services/instances/types";
import { create } from "zustand";
interface IInstanceState {
  id: string;
  setId: (id: string) => void;
}
export const useInstanceStore = create<IInstanceState>((set) => ({
  id: localStorage.getItem("hy2.instance") || DEFAULT_INSTANCE,
  setId: (id) => {
    localStorage.setItem("hy2.instance", id);
    set({ id });
  },
}));
export const useInstanceId = () => useInstanceStore((state) => state.id);
