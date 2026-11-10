import { ChartChoice } from "@/components/overview/system/preferences/ChartChoice";
import { CHART_OPTIONS, useChartStore } from "@/store/overview";
import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "react-i18next";
export function ChartPreferences() {
  const { t } = useTranslation();
  const visible = useChartStore((state) => state.visible);
  const toggle = useChartStore((state) => state.toggle);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="secondary">
          {t("Графики")}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="chart-preferences"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label={t("Видимость графиков")}
        >
          {CHART_OPTIONS.map((option) => (
            <ChartChoice
              key={option.key}
              value={option.key}
              label={option.label}
              isChecked={visible[option.key]}
              onToggle={toggle}
            />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
