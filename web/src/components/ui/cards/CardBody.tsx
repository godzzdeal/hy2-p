import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("form-body grid min-w-0 gap-3 p-4", className)} />;
}
