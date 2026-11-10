import "@/styles/theme/layers.scss";
import classes from "@/styles/index.module.scss";

const MAX_CACHED_CLASSES = 2048;
const cache = new Map<string, string>();

export function styleClass(value: string): string {
  const cached = cache.get(value);
  if (cached !== undefined) return cached;
  const result = value
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => classes[name] ?? name)
    .join(" ");
  if (cache.size >= MAX_CACHED_CLASSES) cache.clear();
  cache.set(value, result);
  return result;
}

export function styledProps(type: unknown, props: unknown): unknown {
  if (
    typeof type !== "string" ||
    typeof props !== "object" ||
    props === null ||
    !("className" in props) ||
    typeof props.className !== "string"
  )
    return props;
  return { ...props, className: styleClass(props.className) };
}
