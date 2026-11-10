export const CHART = { width: 320, height: 128, inset: 8 } as const;

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
