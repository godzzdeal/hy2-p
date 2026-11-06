import * as Primitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp } from "@/shared/icons";
import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/shared/lib";
import { EMPTY_SELECT_VALUE, encodeSelectValue } from "./select-value";
interface ISelect extends Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, "value" | "children"> {
  value: string | number;
  children: ReactNode;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
export function Select({
  value,
  children,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onValueChange,
  ...props
}: ISelect) {
  return (
    <Primitive.Root
      {...props}
      value={encodeSelectValue(value)}
      onValueChange={(next) => onValueChange?.(next === EMPTY_SELECT_VALUE ? "" : next)}
    >
      <Primitive.Trigger
        id={id}
        className={cn("select-trigger", className)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <Primitive.Value />
        <Primitive.Icon asChild>
          <ChevronDown width={24} height={24} aria-hidden />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content className="select-popup" position="popper" sideOffset={4} collisionPadding={8}>
          <Primitive.ScrollUpButton className="select-scroll">
            <ChevronUp width={24} height={24} aria-hidden />
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className="select-viewport">{children}</Primitive.Viewport>
          <Primitive.ScrollDownButton className="select-scroll">
            <ChevronDown width={24} height={24} aria-hidden />
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
