import { Notice } from "@/components/ui/feedback";
import { CompatibilityNotice } from "@/components/elements/CompatibilityNotice";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { RefreshCw } from "@/components/elements/icons";
import { CopyButton } from "@/components/elements/copy";
import { Modal } from "@/components/ui/modal/Modal";
import { QueryState } from "@/components/ui/loading";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { ConnectionQr } from "@/components/users/dialogs/ConnectionQr";
import { useConnection } from "@/hooks/users/connections/use-connection";
import { isUserActive, type IUser } from "@/services/users/user-types";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function ConnectionDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<"uri" | "subscription">("uri");
  const [instanceId, setInstanceId] = useState("");
  const { links, rotate } = useConnection(user.id);
  const connection =
    links.data?.connections?.find((item) => item.instanceId === instanceId) ?? links.data?.connections?.[0];
  const activeFormat = links.data && !links.data.uri ? "subscription" : format;
  const value =
    (activeFormat === "subscription" ? links.data?.subscription : (connection?.uri ?? links.data?.uri)) ?? "";
  return (
    <Modal
      title={t("Подключение: ") + (user.displayName ?? user.name)}
      heading={
        <>
          {t("Подключение: ")}
          <EmojiText value={user.displayName ?? user.name} />
        </>
      }
      onClose={onClose}
    >
      <QueryState isLoading={links.isPending} error={links.error} />
      {links.data && (
        <>
          <div className="share-tabs">
            <button
              disabled={!links.data.uri}
              className={cn({ active: activeFormat === "uri" })}
              onClick={() => setFormat("uri")}
            >
              {t("Подключение / Happ")}
            </button>
            <button
              className={cn({ active: activeFormat === "subscription" })}
              onClick={() => setFormat("subscription")}
            >
              {t("Подписка")}
            </button>
          </div>
          {(links.data.deviceLimit ?? 0) > 0 && (
            <Notice>
              {t(
                "Включён лимит устройств. Импортируйте подписку в Happ, чтобы получить персональный ключ устройства.",
              )}
            </Notice>
          )}
          {!links.data.uri && !(links.data.deviceLimit ?? 0) && (
            <p className="alert">
              {t(
                "Нет доступных подключений. Проверьте доступ пользователя к экземплярам и публикацию портов.",
              )}
            </p>
          )}
          {activeFormat === "uri" && (links.data.connections?.length ?? 0) > 1 && (
            <label>
              {t("Экземпляр")}
              <Select
                aria-label={t("Экземпляр подключения")}
                value={connection?.instanceId ?? ""}
                onValueChange={setInstanceId}
              >
                {links.data.connections?.map((item) => (
                  <SelectOption key={item.instanceId} value={item.instanceId}>
                    {item.name}
                  </SelectOption>
                ))}
              </Select>
            </label>
          )}
          <ConnectionQr
            value={value}
            name={user.displayName ?? user.name}
            isSubscription={activeFormat === "subscription"}
          />
          <CompatibilityNotice
            isVisible={links.data.connections?.some((item) => item.uri.includes("ech=")) ?? false}
          />
          <p className="share-help">
            {t("В Happ нажмите + и импортируйте ссылку из буфера или отсканируйте QR-код.")}
          </p>
          {!isUserActive(user) && <p className="alert">{t("Доступ отключён или истёк.")}</p>}
          <textarea className="share-url" readOnly aria-label={t("Ссылка подключения")} value={value} />
          <CopyButton
            value={value}
            label="Скопировать ссылку"
            variant="primary"
            className="full"
            fallback="Скопируйте ссылку вручную из поля ниже."
          />
          {activeFormat === "subscription" && (
            <button className="text-btn rotate" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
              <RefreshCw width={24} height={24} aria-hidden />
              {t("Заменить ссылку подписки")}
            </button>
          )}
          <p className="muted small">
            {t("Ссылка содержит данные доступа. Передавайте её только владельцу устройства.")}
          </p>
        </>
      )}
    </Modal>
  );
}
