import { styleClass } from "@/styles/runtime";
import { ChevronDown } from "@/components/elements/icons";
import { EMPTY_SELECT_VALUE, encodeSelectValue } from "@/components/ui/select/select-value";
import { cn } from "@/utils/cn";
import { CONTROL_STYLES } from "@/components/ui/fields/controls/control-styles";
import * as Primitive from "@radix-ui/react-select";
import { type ComponentProps } from "react";
interface ISelect
  extends
    Omit<ComponentProps<typeof Primitive.Root>, "value">,
    Omit<ComponentProps<typeof Primitive.Trigger>, "value" | "defaultValue" | "dir"> {
  value: string | number;
}
export function Select({
  value,
  children,
  className,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  defaultValue,
  dir,
  name,
  form,
  required,
  disabled,
  ...triggerProps
}: ISelect) {
  return (
    <Primitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      defaultValue={defaultValue}
      dir={dir}
      name={name}
      form={form}
      required={required}
      disabled={disabled}
      value={encodeSelectValue(value)}
      onValueChange={(next) => onValueChange?.(next === EMPTY_SELECT_VALUE ? "" : next)}
    >
      <Primitive.Trigger
        {...triggerProps}
        className={styleClass(
          cn(
            "select-trigger inline-flex h-control items-center justify-between gap-3 py-0 text-left font-normal aria-expanded:border-accent",
            CONTROL_STYLES,
            className,
          ),
        )}
      >
        <span data-select-value className="min-w-0 flex-1 truncate">
          <Primitive.Value />
        </span>
        <Primitive.Icon asChild>
          <ChevronDown width={24} height={24} className={styleClass("shrink-0 text-muted")} aria-hidden />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          className={styleClass(
            "select-popup z-60 overflow-hidden border-2 border-line bg-surface text-foreground shadow-pixel",
          )}
          position="popper"
          sideOffset={4}
          collisionPadding={8}
        >
          <Primitive.Viewport className={styleClass("min-h-0 overscroll-contain scroll-auto p-1")}>
            {children}
          </Primitive.Viewport>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
