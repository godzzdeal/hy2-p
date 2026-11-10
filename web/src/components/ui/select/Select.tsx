import { ChevronDown, ChevronUp } from "@/components/elements/icons";
import { EMPTY_SELECT_VALUE, encodeSelectValue } from "@/components/ui/select/select-value";
import { cn } from "@/utils/cn";
import * as Primitive from "@radix-ui/react-select";
import { type ComponentProps } from "react";
interface ISelect
  extends
    Omit<ComponentProps<typeof Primitive.Root>, "value">,
    Pick<
      ComponentProps<typeof Primitive.Trigger>,
      "id" | "className" | "aria-label" | "aria-labelledby" | "ref" | "onBlur"
    > {
  value: string | number;
}
export function Select({
  value,
  children,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onValueChange,
  ref,
  onBlur,
  ...props
}: ISelect) {
  return (
    <Primitive.Root
      {...props}
      value={encodeSelectValue(value)}
      onValueChange={(next) => onValueChange?.(next === EMPTY_SELECT_VALUE ? "" : next)}
    >
      <Primitive.Trigger
        ref={ref}
        onBlur={onBlur}
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
