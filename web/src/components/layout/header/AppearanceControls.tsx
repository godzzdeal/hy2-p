import { LanguageSelect } from "@/components/elements/LanguageSelect";
import { ThemeSwitch } from "@/components/layout/sidebar/theme";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

export function AppearanceControls({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("appearance-controls flex items-center gap-1 max-tablet:*:size-12", className)}
    >
      <ThemeSwitch />
      <LanguageSelect />
    </div>
  );
}
