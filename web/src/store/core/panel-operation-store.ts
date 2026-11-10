import { create } from "zustand";
import { type TPanelAction } from "@/services/panel/maintenance";

const STORAGE_KEY = "hy2.panel-operation";
interface IActivePanelOperation {
  ticket: string;
  action: TPanelAction;
}
interface IPanelOperationState {
  active: IActivePanelOperation | null;
  setActive: (active: IActivePanelOperation | null) => void;
}
function readActive(): IActivePanelOperation | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      value &&
      typeof value === "object" &&
      "ticket" in value &&
      typeof value.ticket === "string" &&
      /^[a-f0-9]{32}$/.test(value.ticket) &&
      "action" in value &&
      (value.action === "update" ||
        value.action === "rollback" ||
        value.action === "restart" ||
        value.action === "cleanup")
    )
      return { ticket: value.ticket, action: value.action };
  } catch {
    /* An interrupted browser write does not block panel startup. */
  }
  return null;
}
export const usePanelOperationStore = create<IPanelOperationState>((set) => ({
  active: readActive(),
  setActive: (active) => {
    try {
      if (active) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Continue monitoring when browser storage is unavailable. */
    }
    set({ active });
  },
}));
