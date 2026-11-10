import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

interface ICard extends ComponentProps<"section"> {
  as?: "section" | "figure";
}
export function Card({ as: Element = "section", className, ...props }: ICard) {
  return (
    <Element
      {...props}
      className={cn("card mb-4 min-w-0 border-2 border-line bg-surface shadow-pixel", className)}
    />
  );
}
