import { Card } from "@/components/ui/cards/Card";
import { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";
interface IMetric extends ComponentProps<"section"> {
  label: ReactNode;
  value: ReactNode;
}
export function Metric({ label, value, children, className, ...props }: IMetric) {
  return (
    <Card {...props} className={cn("metric mb-0 p-4", className)}>
      <div className="text-muted">{label}</div>
      <strong className="my-2 block text-2xl leading-tight font-semibold wrap-anywhere">{value}</strong>
      <small className="text-muted">{children}</small>
    </Card>
  );
}
