import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { type IUser } from "@/features/users/model";
import { userApi, isUserActive } from "@/features/users/model";
import { Modal, QueryState } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { useUiStore } from "@/app/state";
export function ConnectionDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<"uri" | "subscription">("uri");
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
  async function onCopy() {
    if (!links.data) return;
    try {
      await navigator.clipboard.writeText(links.data[format]);
      notify(t("Скопировано"));
    } catch {
      showError(new Error(t("Скопируйте ссылку вручную из поля ниже.")));
    }
  }
  return (
    <Modal title={t("Подключение: ") + user.name} onClose={onClose}>
      <QueryState isLoading={links.isPending} error={links.error} />
      {links.data && (
        <>
          <div className="share-tabs">
            <button className={cn({ active: format === "uri" })} onClick={() => setFormat("uri")}>
              {t("Подключение / Happ")}
            </button>
            <button
              className={cn({ active: format === "subscription" })}
              onClick={() => setFormat("subscription")}
            >
              {t("Подписка")}
            </button>
          </div>
          <div className="qr">
            <QRCodeSVG
              value={links.data[format]}
              size={224}
              level="M"
              marginSize={4}
              aria-label={t("QR-код подключения")}
            />
          </div>
          <p className="share-help">
            {t("В Happ нажмите + и импортируйте ссылку из буфера или отсканируйте QR-код.")}
          </p>
          {!isUserActive(user) && <p className="alert">{t("Доступ отключён или истёк.")}</p>}
          <textarea
            className="share-url"
            readOnly
            aria-label={t("Ссылка подключения")}
            value={links.data[format]}
          />
          <button className="primary full" onClick={() => void onCopy()}>
            <Copy size={16} aria-hidden />
            {t("Скопировать ссылку")}
          </button>
          {format === "subscription" && (
            <button className="text-btn rotate" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
              <RefreshCw size={16} aria-hidden />
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
