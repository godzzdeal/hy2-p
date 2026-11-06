import { EmojiText } from "@/shared/emoji";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, RefreshCw } from "@/shared/icons";
import { ConnectionQr } from "./ConnectionQr";
import { type IUser } from "@/features/users/model";
import { userApi, isUserActive } from "@/features/users/model";
import { Modal, QueryState } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { useUiStore } from "@/app/state";
import { Select, SelectOption } from "@/shared/ui/select";
export function ConnectionDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<"uri" | "subscription">("uri");
  const [instanceId, setInstanceId] = useState("");
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  const queryKey = ["connection", user.id];
  const links = useQuery({
    queryKey,
    queryFn: () => userApi.links(user.id),
    staleTime: 0,
  });
  const rotate = useMutation({
    mutationFn: () => userApi.rotate(user.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey });
      notify(t("Старая ссылка подписки отозвана"));
    },
    onError: showError,
  });
  const connection =
    links.data?.connections?.find((item) => item.instanceId === instanceId) ?? links.data?.connections?.[0];
  const activeFormat = links.data && !links.data.uri ? "subscription" : format;
  const value =
    (activeFormat === "subscription" ? links.data?.subscription : (connection?.uri ?? links.data?.uri)) ?? "";
  async function onCopy() {
    if (!links.data) return;
    try {
      await navigator.clipboard.writeText(value);
      notify(t("Скопировано"));
    } catch {
      showError(new Error(t("Скопируйте ссылку вручную из поля ниже.")));
    }
  }
  return (
    <Modal
      title={t("Подключение: ") + user.name}
      heading={
        <>
          {t("Подключение: ")}
          <EmojiText value={user.name} />
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
            <p className="info-note">
              {t(
                "Включён лимит устройств. Импортируйте подписку в Happ, чтобы получить персональный ключ устройства.",
              )}
            </p>
          )}
          {!links.data.uri && !(links.data.deviceLimit ?? 0) && (
            <p className="alert">
              {t("Нет доступных подключений. Проверьте доступ пользователя к ядрам и публикацию портов.")}
            </p>
          )}
          {activeFormat === "uri" && (links.data.connections?.length ?? 0) > 1 && (
            <label>
              {t("Ядро")}
              <Select
                aria-label={t("Ядро подключения")}
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
          <ConnectionQr value={value} name={user.name} isSubscription={activeFormat === "subscription"} />
          <p className="share-help">
            {t("В Happ нажмите + и импортируйте ссылку из буфера или отсканируйте QR-код.")}
          </p>
          {!isUserActive(user) && <p className="alert">{t("Доступ отключён или истёк.")}</p>}
          <textarea className="share-url" readOnly aria-label={t("Ссылка подключения")} value={value} />
          <button className="primary full" onClick={() => void onCopy()}>
            <Copy width={24} height={24} aria-hidden />
            {t("Скопировать ссылку")}
          </button>
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
