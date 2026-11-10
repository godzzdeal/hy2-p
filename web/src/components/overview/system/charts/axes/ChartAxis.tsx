import { AxisTick } from "@/components/overview/system/charts/axes/AxisTick";
import { cn } from "@/utils/cn";
export function ChartAxis({
  labels,
  isHorizontal = false,
}: {
  labels: readonly string[];
  isHorizontal?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("chart-axis", isHorizontal ? "chart-axis-time" : "chart-axis-values")}
    >
      {labels.map((label, index) => (
        <AxisTick key={index} label={label} />
      ))}
    </div>
  );
}
