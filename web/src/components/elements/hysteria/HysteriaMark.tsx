import { HY2_ACCENT, HY2_MARK } from "@/components/elements/hysteria/mark";

export function HysteriaMark({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path d={HY2_MARK} fill="currentColor" />
      <path d={HY2_ACCENT} className="hysteria-mark-accent" />
    </svg>
  );
}
