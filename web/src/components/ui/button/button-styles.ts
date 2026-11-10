import { cn } from "@/utils/cn";

export const BUTTON_VARIANTS = {
  primary: "border-accent bg-accent text-accent-text font-semibold shadow-pixel hover:bg-accent-hover",
  secondary: "border-line bg-surface-soft text-foreground shadow-pixel hover:border-accent hover:bg-input",
  ghost: "text-foreground hover:bg-surface-soft hover:text-accent",
  outline: "border-line bg-surface text-foreground hover:border-accent hover:bg-surface-soft",
  danger: "text-danger hover:border-danger hover:bg-danger-bg",
  destructive: "border-danger bg-danger text-background hover:opacity-90",
} as const;

export type TButtonVariant = keyof typeof BUTTON_VARIANTS;
export type TButtonSize = "default" | "icon";

export function buttonStyles(variant: TButtonVariant = "ghost", size: TButtonSize = "default") {
  return cn(
    "justify-self-start",
    "inline-flex min-h-control min-w-0 max-w-full shrink-0 items-center justify-center gap-2 border-2 border-transparent px-3 py-1 text-xl leading-5 font-normal no-underline outline-none transition-transform duration-150 active:translate-y-1 motion-reduce:translate-none aria-pressed:bg-surface-soft aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none",
    BUTTON_VARIANTS[variant],
    size === "icon" && "size-control p-1",
  );
}
