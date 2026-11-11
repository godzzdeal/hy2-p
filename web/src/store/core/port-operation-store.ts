import { create } from "zustand";
const STORAGE_KEY = "hy2.udp-operation";
interface IPortOperationState {
  ticket: string;
  setTicket: (ticket: string) => void;
}
export const usePortOperationStore = create<IPortOperationState>((set) => ({
  ticket: typeof window === "undefined" ? "" : (sessionStorage.getItem(STORAGE_KEY) ?? ""),
  setTicket: (ticket) => {
    if (ticket) sessionStorage.setItem(STORAGE_KEY, ticket);
    else sessionStorage.removeItem(STORAGE_KEY);
    set({ ticket });
  },
}));
