import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["control", "header", "sidebar"],
      shadow: ["pixel", "popup"],
    },
  },
});
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
