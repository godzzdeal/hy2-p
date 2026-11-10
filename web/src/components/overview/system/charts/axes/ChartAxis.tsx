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
      className={cn(
        "chart-axis flex text-muted text-lg justify-between leading-none",
        isHorizontal
          ? "chart-axis-time col-start-2 gap-2 px-2"
          : "chart-axis-values flex-col text-right h-32 whitespace-nowrap",
      )}
    >
      {labels.map((label, index) => (
        <AxisTick key={index} label={label} />
      ))}
    </div>
  );
}
