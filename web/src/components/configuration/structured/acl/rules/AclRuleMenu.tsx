import * as Menu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button/Button";
import { ChevronUp, ChevronDown, MoreHorizontal, Trash2 } from "@/components/elements/icons";
import { POPUP_STYLES, MENU_ITEM_STYLES } from "@/components/ui/overlays/overlay-styles";
import type { IAclRuleRow } from "./AclRuleRow";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

export function AclRuleMenu({
  index,
  total,
  isDisabled,
  onMove,
  onRemove,
}: Pick<IAclRuleRow, "index" | "total" | "isDisabled" | "onMove" | "onRemove">) {
  const { t } = useTranslation();
  const label = t("Действия правила {{number}}", { number: index + 1 });
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button type="button" size="icon" disabled={isDisabled} aria-label={label} title={label}>
          <MoreHorizontal width={24} height={24} aria-hidden />
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className={cn(POPUP_STYLES, "min-w-40 p-1")}
          aria-label={label}
        >
          <Menu.Item
            className={MENU_ITEM_STYLES}
            disabled={isDisabled || index === 0}
            aria-label={t("Переместить правило {{number}} выше", { number: index + 1 })}
            onSelect={() => onMove(index, -1)}
          >
            <ChevronUp width={24} height={24} aria-hidden />
            {t("Выше")}
          </Menu.Item>
          <Menu.Item
            className={MENU_ITEM_STYLES}
            disabled={isDisabled || index + 1 >= total}
            aria-label={t("Переместить правило {{number}} ниже", { number: index + 1 })}
            onSelect={() => onMove(index, 1)}
          >
            <ChevronDown width={24} height={24} aria-hidden />
            {t("Ниже")}
          </Menu.Item>
          <Menu.Item
            className={cn(
              MENU_ITEM_STYLES,
              "text-danger data-highlighted:bg-danger-bg data-highlighted:text-danger",
            )}
            disabled={isDisabled}
            aria-label={t("Удалить правило {{number}}", { number: index + 1 })}
            onSelect={() => onRemove(index)}
          >
            <Trash2 width={24} height={24} aria-hidden />
            {t("Удалить")}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
