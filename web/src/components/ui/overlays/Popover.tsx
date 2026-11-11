import { POPUP_STYLES } from "@/components/ui/overlays/overlay-styles";
import { cn } from "@/utils/cn";
import * as Primitive from "@radix-ui/react-popover";
import { type ComponentProps, type ReactNode } from "react";
interface IPopover extends ComponentProps<typeof Primitive.Root> {
  trigger: ReactNode;
  contentProps?: ComponentProps<typeof Primitive.Content>;
}
export function Popover({ trigger, children, contentProps, ...props }: IPopover) {
  return (
    <Primitive.Root {...props}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          {...contentProps}
          className={cn(POPUP_STYLES, contentProps?.className)}
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
