const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const ASCII_A = 65;
const REGIONS = [
  "RU",
  "DE",
  "NL",
  "FI",
  "FR",
  "GB",
  "US",
  "CA",
  "SE",
  "NO",
  "CH",
  "PL",
  "EE",
  "LV",
  "LT",
  "TR",
  "KZ",
  "JP",
  "SG",
  "AU",
] as const;
export const FLAGS = REGIONS.map((region) => ({
  region,
  flag: String.fromCodePoint(
    ...Array.from(region, (letter) => REGIONAL_INDICATOR_BASE + letter.charCodeAt(0) - ASCII_A),
  ),
}));
export const FLAG_PREFIX = /^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u;
export function withDefaultFlag(name: string, flag: string): string {
  return !flag || FLAG_PREFIX.test(name) ? name : flag + " " + name;
}
export function replaceFlag(title: string, flag: string): string {
  const name = title.replace(FLAG_PREFIX, "");
  return flag ? flag + " " + name : name;
}

export function regionFromFlag(value: string): string {
  if (!/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(value)) return "";
  return Array.from(value, (letter) =>
    String.fromCharCode((letter.codePointAt(0) ?? 0) - REGIONAL_INDICATOR_BASE + ASCII_A),
  ).join("");
}
