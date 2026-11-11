import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/fields/Field";
import { Textarea } from "@/components/ui/fields/controls/Textarea";
import { Notice } from "@/components/ui/feedback";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { RefreshCw } from "@/components/elements/icons";
import { CopyButton } from "@/components/elements/copy";
import { Modal } from "@/components/ui/overlays/Modal";
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
          {!isUserActive(user) && <Notice variant="danger">{t("Доступ отключён или истёк.")}</Notice>}
          {(links.data.deviceLimit ?? 0) > 0 && (
            <Notice variant="warning">
              {t(
                "Включён лимит устройств. Импортируйте подписку в используемом приложении, чтобы получить персональный ключ устройства.",
              )}
            </Notice>
          )}
          {!links.data.uri && !(links.data.deviceLimit ?? 0) && (
            <Notice variant="danger">
              {t(
                "Нет доступных подключений. Проверьте доступ пользователя к экземплярам и публикацию портов.",
              )}
            </Notice>
          )}
          <div className="share-tabs grid grid-cols-2 items-stretch gap-1 border-2 border-line p-1">
            <Button
              disabled={!links.data.uri}
              aria-pressed={activeFormat === "uri"}
              className={cn("h-auto min-h-control w-full px-2 py-2 text-lg whitespace-normal", {
                active: activeFormat === "uri",
              })}
              onClick={() => setFormat("uri")}
            >
              {t("Ссылка подключения")}
            </Button>
            <Button
              className={cn("h-auto min-h-control w-full px-2 py-2 text-lg whitespace-normal", {
                active: activeFormat === "subscription",
              })}
              aria-pressed={activeFormat === "subscription"}
              onClick={() => setFormat("subscription")}
            >
              {t("Подписка")}
            </Button>
          </div>
          {activeFormat === "uri" && (links.data.connections?.length ?? 0) > 1 && (
            <Field>
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
            </Field>
          )}
          <ConnectionQr
            value={value}
            name={user.displayName ?? user.name}
            isSubscription={activeFormat === "subscription"}
          />
          <p className="share-help text-center text-muted mb-4">
            {t("Импортируйте ссылку из буфера обмена или отсканируйте QR-код в используемом приложении.")}
          </p>
          <Textarea
            className="share-url h-24 resize-none break-all mb-4"
            readOnly
            aria-label={t("Ссылка подключения")}
            value={value}
          />
          <CopyButton
            value={value}
            label="Скопировать ссылку"
            variant="primary"
            className="full w-full"
            fallback="Скопируйте ссылку вручную из поля ниже."
          />
          {activeFormat === "subscription" && (
            <Button
              className="rotate flex"
              variant="outline"
              disabled={rotate.isPending}
              onClick={() => rotate.mutate()}
            >
              <RefreshCw width={24} height={24} aria-hidden />
              {t("Заменить ссылку подписки")}
            </Button>
          )}
          <p className="muted small">
            {t("Ссылка содержит данные доступа. Передавайте её только владельцу устройства.")}
          </p>
        </>
      )}
    </Modal>
  );
}
