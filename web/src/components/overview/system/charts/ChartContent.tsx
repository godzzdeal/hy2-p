import { ChartPlot } from "@/components/overview/system/charts/plot";
import { chartMaximum } from "@/components/overview/system/charts/axes";
import { type IMetricChart } from "@/components/overview/system/charts/chart-types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

interface IChartContent extends IMetricChart {
  isVisible: boolean;
}

export const ChartContent = memo(
  function ChartContent({
    title,
    samples,
    field,
    secondary,
    value,
    maximum,
    unit = "number",
  }: IChartContent) {
    const { t } = useTranslation();
    const primary = samples.map((sample) => sample[field]);
    const other = secondary ? samples.map((sample) => sample[secondary]) : [];
    const ceiling = chartMaximum([...primary, ...other], unit, maximum);
    return (
      <>
        <figcaption>
          <h3>{t(title)}</h3>
          <strong>{value}</strong>
        </figcaption>
        <ChartPlot
          title={title}
          primary={primary}
          secondary={other}
          maximum={ceiling}
          unit={unit}
          times={samples.map((sample) => sample.time)}
        />
        <small>{samples.length > 1 ? t("Последние 10 минут") : t("Собираем данные…")}</small>
      </>
    );
  },
  (_, next) => !next.isVisible,
);
