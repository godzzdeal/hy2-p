export function normalizeVersion(value: string): string {
  return value.replace(/^app\//, "").replace(/^v/, "");
}

const SEMANTIC_VERSION = /^\d+\.\d+\.\d+$/;
export function isNewerVersion(current: string, target: string): boolean {
  const installed = normalizeVersion(current);
  const candidate = normalizeVersion(target);
  if (!SEMANTIC_VERSION.test(installed) || !SEMANTIC_VERSION.test(candidate)) return false;
  const previous = installed.split(".").map(BigInt);
  for (const [index, next] of candidate.split(".").map(BigInt).entries()) {
    const before = previous[index];
    if (before === undefined) return false;
    if (next !== before) return next > before;
  }
  return false;
}
