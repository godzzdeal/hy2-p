export const CHART = { width: 320, height: 128, inset: 8 } as const;
export const CHART_TICKS = [1, 0.75, 0.5, 0.25, 0] as const;
export function chartGridPath(): string {
  return CHART_TICKS.map((ratio) => {
    const y = CHART.height - CHART.inset - ratio * (CHART.height - CHART.inset * 2);
    return `M${CHART.inset} ${y}H${CHART.width - CHART.inset}`;
  }).join(" ");
}

export function chartPoints(values: readonly number[], maximum: number): string {
  const span = Math.max(values.length - 1, 1);
  const ceiling = Math.max(maximum, 1);
  return values
    .map((value, index) => {
      const x = CHART.inset + (index / span) * (CHART.width - CHART.inset * 2);
      const y =
        CHART.height -
        CHART.inset -
        (Math.min(Math.max(value, 0), ceiling) / ceiling) * (CHART.height - CHART.inset * 2);
      return x.toFixed(2) + "," + y.toFixed(2);
    })
    .join(" ");
}
