import { Badge } from "@/components/ui/status/Badge";
import { HysteriaMark } from "./HysteriaMark";
import { cn } from "@/utils/cn";
import type { ComponentProps } from "react";

export function HysteriaBadge({ className, ...props }: Omit<ComponentProps<typeof Badge>, "children">) {
  return (
    <Badge
      role="img"
      aria-label="Hysteria2"
      title="Hysteria2"
      {...props}
      className={cn("h-8 w-8 shrink-0 border-2 border-line bg-surface-soft p-0 text-accent", className)}
    >
      <HysteriaMark />
    </Badge>
  );
}
