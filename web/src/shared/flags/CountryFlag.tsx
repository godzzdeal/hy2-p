import { useState } from "react";
import { regionFromFlag } from "./flag-options";
export function CountryFlag({ value, label = "" }: { value: string; label?: string }) {
  const region = regionFromFlag(value);
  const [failedRegion, setFailedRegion] = useState("");
  if (!region) return null;
  return (
    <img
      className="country-flag"
      src={failedRegion === region ? "/flags/xx.svg" : "/flags/" + region.toLowerCase() + ".svg"}
      alt={label}
      width={32}
      height={24}
      onError={() => setFailedRegion(region)}
    />
  );
}
