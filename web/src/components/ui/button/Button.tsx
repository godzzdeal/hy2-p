import { buttonStyles, type TButtonSize, type TButtonVariant } from "@/components/ui/button/button-styles";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";

interface IButton extends ComponentProps<"button"> {
  variant?: TButtonVariant;
  size?: TButtonSize;
}

export function Button({ variant = "ghost", size = "default", className, ...props }: IButton) {
  return <button {...props} className={cn(buttonStyles(variant, size), className)} />;
}
