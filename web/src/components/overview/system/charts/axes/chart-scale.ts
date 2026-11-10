import { CHART_TICKS } from "@/components/overview/system/charts/plot/chart-path";
import { formatBytes } from "@/services/users/traffic/traffic-types";
import { type TFunction } from "i18next";
export type TChartUnit = "percent" | "rate" | "number";
const TIME_FORMATTERS = new Map<string, Intl.DateTimeFormat>();
const NICE_STEPS = [1, 2, 5, 10] as const;
const RATE_BASELINE = 1024;
export function chartMaximum(values: readonly number[], unit: TChartUnit, minimum = 0): number {
  const maximum = Math.max(...values, minimum, unit === "rate" ? RATE_BASELINE : 1);
  if (unit === "percent") return 100;
  if (unit === "rate") return 2 ** Math.ceil(Math.log2(maximum));
  const step = maximum / 4;
  const power = 10 ** Math.floor(Math.log10(step));
  const rounded = NICE_STEPS.find((value) => value * power >= step) ?? 10;
  return rounded * power * 4;
}
export function chartLabels(maximum: number, unit: TChartUnit, t: TFunction, locale: string): string[] {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return CHART_TICKS.map((ratio) => {
    const value = maximum * ratio;
    if (unit === "percent") return value + "%";
    if (unit === "rate") return formatBytes(value, t) + t("/с");
    return formatter.format(value);
  });
}
export function chartTimes(times: readonly number[], locale: string): string[] {
  if (!times.length) return [];
  let formatter = TIME_FORMATTERS.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    TIME_FORMATTERS.set(locale, formatter);
  }
  return [times[0], times.at(-1)!].map((time) => formatter.format(time));
}
