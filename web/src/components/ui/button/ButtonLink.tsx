import { buttonStyles, type TButtonVariant } from "@/components/ui/button/button-styles";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

interface IButtonLink extends ComponentProps<"a"> {
  variant?: TButtonVariant;
}

export function ButtonLink({ variant = "secondary", className, ...props }: IButtonLink) {
  return <a {...props} className={cn(buttonStyles(variant), className)} />;
}
