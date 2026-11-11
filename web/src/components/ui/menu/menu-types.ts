import type { ComponentType, SVGProps } from "react";

export interface IMenuOption<TValue extends string = string> {
  value: TValue;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}
