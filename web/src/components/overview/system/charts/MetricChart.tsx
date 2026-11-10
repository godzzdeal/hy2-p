import { Card } from "@/components/ui/cards/Card";
import { ChartContent } from "@/components/overview/system/charts/ChartContent";
import { type IMetricChart } from "@/components/overview/system/charts/chart-types";
import { useViewportVisibility } from "@/hooks/layout/use-viewport-visibility";

export function MetricChart(props: IMetricChart) {
  const { ref, isVisible } = useViewportVisibility();
  return (
    <Card ref={ref} as="figure" className="system-chart m-0 flex flex-col p-4">
      <ChartContent {...props} isVisible={isVisible} />
    </Card>
  );
}
