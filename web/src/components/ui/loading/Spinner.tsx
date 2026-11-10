import { Loader as SpinnerIcon } from "pixelarticons/react/Loader.js";
import { type ComponentProps } from "react";
import { cn } from "@/utils/cn";

export function Spinner({ className, ...props }: ComponentProps<typeof SpinnerIcon>) {
  return (
    <SpinnerIcon width={32} height={32} {...props} className={cn("spinner", className)} aria-hidden="true" />
  );
}
