import { Button } from "@/components/ui/button/Button";
import { ChartChoice } from "@/components/overview/system/preferences/ChartChoice";
import { CHART_OPTIONS, useChartStore } from "@/store/overview";
import { Popover } from "@/components/ui/overlays/Popover";
import { useTranslation } from "react-i18next";
export function ChartPreferences() {
  const { t } = useTranslation();
  const visible = useChartStore((state) => state.visible);
  const toggle = useChartStore((state) => state.toggle);
  return (
    <Popover
      trigger={
        <Button type="button" variant="secondary">
          {t("Графики")}
        </Button>
      }
      contentProps={{ className: "chart-preferences", "aria-label": t("Видимость графиков") }}
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
    </Popover>
  );
}
