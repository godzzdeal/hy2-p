import { useState, type FormEvent } from "react";
import { useAdjustTraffic } from "./use-traffic";
import { BYTE_UNITS, type IUserUsage } from "@/services/users/traffic/traffic-types";

export function useTrafficForm(userId: string, usage: IUserUsage, onClose: () => void) {
  const [unit, setUnit] = useState<number>(BYTE_UNITS.gigabyte);
  const [upload, setUpload] = useState<string>();
  const [download, setDownload] = useState<string>();
  const [limit, setLimit] = useState(String(usage.limit / BYTE_UNITS.gigabyte));
  const mutation = useAdjustTraffic();
  function onUnit(next: string) {
    const nextUnit = Number(next);
    if (!Object.values(BYTE_UNITS).some((value) => value === nextUnit)) return;
    function convert(value: string | undefined) {
      return value === undefined || value === "" ? value : String((Number(value) * unit) / nextUnit);
    }
    setUpload(convert);
    setDownload(convert);
    setLimit((value) => convert(value) ?? "");
    setUnit(nextUnit);
  }
  function onResetCounters() {
    setUpload("0");
    setDownload("0");
  }
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(
      {
        id: userId,
        upload: upload === undefined ? undefined : Math.round(Number(upload) * unit),
        download: download === undefined ? undefined : Math.round(Number(download) * unit),
        limit: Math.round(Number(limit) * unit),
      },
      { onSuccess: onClose },
    );
  }
  return {
    unit,
    onUnit,
    upload: upload ?? String(usage.upload / unit),
    download: download ?? String(usage.download / unit),
    limit,
    setUpload,
    setDownload,
    setLimit,
    onResetCounters,
    onSubmit,
    isPending: mutation.isPending,
  };
}
