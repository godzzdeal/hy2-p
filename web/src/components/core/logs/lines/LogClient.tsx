import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { type ILogClient } from "@/utils/core/logs";
import { useTranslation } from "react-i18next";

export function LogClient({ client }: { client: ILogClient }) {
  const { t } = useTranslation();
  return (
    <span
      className="log-client flex items-center flex-wrap gap-2 mb-1 text-accent font-semibold"
      title={client.identity}
    >
      <span>{t("Пользователь")}:</span> <EmojiText value={client.name} />
      {client.deviceId && (
        <small>
          {t("Устройство")}: {client.deviceId.slice(0, 8)}
        </small>
      )}
    </span>
  );
}
