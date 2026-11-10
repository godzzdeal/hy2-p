import { ChartPlot } from "@/components/overview/system/charts/plot";
import { chartMaximum, type TChartUnit } from "@/components/overview/system/charts/axes";
import { type ISystemSample } from "@/services/admin/maintenance";
import { useTranslation } from "react-i18next";

type TMetric = Exclude<keyof ISystemSample, "time">;
interface IMetricChart {
  title: string;
  samples: ISystemSample[];
  field: TMetric;
  secondary?: TMetric;
  value: string;
  maximum?: number;
  unit?: TChartUnit;
}

export function MetricChart({
  title,
  samples,
  field,
  secondary,
  value,
  maximum,
  unit = "number",
}: IMetricChart) {
  const { t } = useTranslation();
  const primary = samples.map((sample) => sample[field]);
  const other = secondary ? samples.map((sample) => sample[secondary]) : [];
  const ceiling = chartMaximum([...primary, ...other], unit, maximum);
  return (
    <figure className="card system-chart">
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
    </figure>
  );
}
