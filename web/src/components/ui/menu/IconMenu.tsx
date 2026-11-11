import * as Menu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button/Button";
import { POPUP_STYLES } from "@/components/ui/overlays/overlay-styles";
import { MenuOption } from "./MenuOption";
import type { IMenuOption } from "./menu-types";
import type { ComponentProps, ComponentType, SVGProps } from "react";
import { cn } from "@/utils/cn";

interface IIconMenu<TValue extends string> extends Omit<
  ComponentProps<typeof Button>,
  "value" | "onChange" | "children"
> {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: TValue;
  options: readonly IMenuOption<TValue>[];
  onValueChange: (value: TValue) => void;
}

export function IconMenu<TValue extends string>({
  label,
  icon: Icon,
  value,
  options,
  onValueChange,
  className,
  ...props
}: IIconMenu<TValue>) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <Button
          {...props}
          className={cn("aria-expanded:bg-surface-soft aria-expanded:text-accent", className)}
          type="button"
          size="icon"
          aria-label={label}
          title={label}
        >
          <Icon width={24} height={24} aria-hidden />
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          aria-label={label}
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className={cn(POPUP_STYLES, "min-w-48 p-1")}
        >
          <Menu.RadioGroup
            value={value}
            onValueChange={(next) => {
              const option = options.find((item) => item.value === next);
              if (option) onValueChange(option.value);
            }}
          >
            {options.map((option) => (
              <MenuOption key={option.value} option={option} />
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
