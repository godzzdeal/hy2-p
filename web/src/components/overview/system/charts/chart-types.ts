import { type ISystemSample } from "@/services/admin/maintenance";
import { type TChartUnit } from "@/components/overview/system/charts/axes";

type TMetric = Exclude<keyof ISystemSample, "time">;
export interface IMetricChart {
  title: string;
  samples: ISystemSample[];
  field: TMetric;
  secondary?: TMetric;
  value: string;
  maximum?: number;
  unit?: TChartUnit;
}
