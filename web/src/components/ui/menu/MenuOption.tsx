import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check } from "@/components/elements/icons";
import type { IMenuOption } from "./menu-types";

export function MenuOption({ option }: { option: IMenuOption }) {
  return (
    <Menu.RadioItem
      value={option.value}
      className="flex min-h-control cursor-pointer items-center gap-3 px-3 py-2 text-xl text-foreground outline-none data-highlighted:bg-surface-soft data-highlighted:text-accent selected-option:text-accent selected-option:font-semibold"
    >
      {option.icon && <option.icon width={24} height={24} aria-hidden />}
      <span className="flex-1 whitespace-nowrap">{option.label}</span>
      <span className="flex w-6 justify-center">
        <Menu.ItemIndicator>
          <Check width={20} height={20} aria-hidden />
        </Menu.ItemIndicator>
      </span>
    </Menu.RadioItem>
  );
}
