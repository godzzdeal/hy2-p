import { create } from "zustand";
const MAX_NOTIFICATIONS = 5;
export interface INotification {
  id: number;
  message: string;
  isError: boolean;
}
interface INotificationState {
  items: INotification[];
  push: (message: string, isError?: boolean) => void;
  dismiss: (id: number) => void;
}
let sequence = 0;
export const useNotifications = create<INotificationState>((set) => ({
  items: [],
  push: (message, isError = false) =>
    set((state) => {
      if (state.items.some((item) => item.message === message)) return state;
      return {
        items: [...state.items, { id: ++sequence, message, isError }].slice(-MAX_NOTIFICATIONS),
      };
    }),
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));
