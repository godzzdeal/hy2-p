import { regionFromFlag } from "@/utils/flags/flag-options";
import { useState, type ComponentProps } from "react";
import Image from "next/image";
interface ICountryFlag extends Pick<ComponentProps<typeof Image>, "loading"> {
  value: string;
  label?: string;
}
export function CountryFlag({ value, label = "", loading = "eager" }: ICountryFlag) {
  const region = regionFromFlag(value);
  const [failedRegion, setFailedRegion] = useState("");
  if (!region) return null;
  return (
    <Image
      className="country-flag inline-block flex-none w-8 h-6 object-contain align-middle"
      src={failedRegion === region ? "/flags/xx.svg" : "/flags/" + region.toLowerCase() + ".svg"}
      alt={label}
      loading={loading}
      decoding="async"
      width={32}
      height={24}
      onError={() => setFailedRegion(region)}
    />
  );
}
