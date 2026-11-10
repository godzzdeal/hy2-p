import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { type ILogClient } from "@/utils/core/logs";
import { useTranslation } from "react-i18next";

export function LogClient({ client }: { client: ILogClient }) {
  const { t } = useTranslation();
  return (
    <span className="log-client" title={client.identity}>
      <span>{t("Пользователь")}:</span> <EmojiText value={client.name} />
      {client.deviceId && (
        <small>
          {t("Устройство")}: {client.deviceId.slice(0, 8)}
        </small>
      )}
    </span>
  );
}
