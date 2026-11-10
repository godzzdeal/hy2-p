import { DEFAULT_CHARTS, type TChartVisibility } from "./chart-model";
const STORAGE_KEY = "hy2.overview.charts.v1";
export function readCharts(): TChartVisibility {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (value && typeof value === "object") {
      return {
        cpu: "cpu" in value && typeof value.cpu === "boolean" ? value.cpu : true,
        memory: "memory" in value && typeof value.memory === "boolean" ? value.memory : true,
        load: "load" in value && typeof value.load === "boolean" ? value.load : true,
        network: "network" in value && typeof value.network === "boolean" ? value.network : true,
      };
    }
  } catch {
    /* Broken browser preferences fall back to visible charts. */
  }
  return { ...DEFAULT_CHARTS };
}
export function saveCharts(value: TChartVisibility): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Visibility remains usable when browser storage is unavailable. */
  }
}
