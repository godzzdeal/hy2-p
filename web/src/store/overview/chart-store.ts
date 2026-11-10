import { create } from "zustand";
import { type TChart, type TChartVisibility } from "./chart-model";
import { readCharts, saveCharts } from "./chart-storage";
interface IChartState {
  visible: TChartVisibility;
  toggle: (chart: TChart) => void;
}
export const useChartStore = create<IChartState>((set) => ({
  visible: readCharts(),
  toggle: (chart) =>
    set((state) => {
      const visible = { ...state.visible, [chart]: !state.visible[chart] };
      saveCharts(visible);
      return { visible };
    }),
}));
