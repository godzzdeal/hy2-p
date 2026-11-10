import { ChartLine } from "@/components/overview/system/charts/ChartLine";
import { CHART } from "@/components/overview/system/charts/chart-path";
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
}

export function MetricChart({ title, samples, field, secondary, value, maximum }: IMetricChart) {
  const { t } = useTranslation();
  const primary = samples.map((sample) => sample[field]);
  const other = secondary ? samples.map((sample) => sample[secondary]) : [];
  const ceiling = maximum ?? Math.max(...primary, ...other, 1);
  return (
    <figure className="card system-chart">
      <figcaption>
        <h3>{t(title)}</h3>
        <strong>{value}</strong>
      </figcaption>
      <svg
        role="img"
        aria-label={t(title)}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="none"
      >
        <ChartLine values={primary} maximum={ceiling} />
        <ChartLine values={other} maximum={ceiling} isSecondary />
      </svg>
      <small>{samples.length > 1 ? t("Последние 10 минут") : t("Собираем данные…")}</small>
    </figure>
  );
}
