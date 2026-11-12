import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

interface IByteRow {
  label: string;
  bytes: number;
  direction?: "receive" | "transmit";
  isAvailable?: boolean;
}

export function ByteRow({ label, bytes, direction, isAvailable = true }: IByteRow) {
  const { t } = useTranslation();
  return (
    <div className="system-storage-row flex items-baseline justify-between gap-3 min-w-0">
      <span>{t(label)}</span>
      <strong>
        {isAvailable ? (
          <>
            {direction && (
              <span
                className={cn("text-accent", { "text-syntax-number": direction === "transmit" })}
                aria-hidden
              >
                {direction === "receive" ? "↓ " : "↑ "}
              </span>
            )}
            {formatBytes(bytes, t)}
          </>
        ) : (
          t("Недоступно")
        )}
      </strong>
    </div>
  );
}
