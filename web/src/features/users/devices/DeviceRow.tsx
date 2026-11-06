import { useTranslation } from "react-i18next";
import { type IDevice } from "./model";
import { formatDateTime } from "@/shared/lib";
import { cn } from "@/shared/lib";
import { Trash2 } from "@/shared/icons";
export function DeviceRow({
  device,
  isPending,
  onBlocked,
  onRemove,
}: {
  device: IDevice;
  isPending: boolean;
  onBlocked: (blocked: boolean) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="device-row" aria-label={device.model || device.id}>
      <div className="device-heading">
        <strong>{device.model || device.os || t("Неизвестное устройство")}</strong>
        <span className={cn("badge", { green: !device.blocked && (device.online ?? 0) > 0 })}>
          {t(
            device.blocked
              ? "Отключено"
              : (device.online ?? 0) > 0
                ? "В сети"
                : device.statusAvailable
                  ? "Не в сети"
                  : "Статус недоступен",
          )}
        </span>
      </div>
      <p className="caption">
        {device.os} {device.osVersion}
      </p>
      <dl>
        <div>
          <dt>{t("Приложение")}</dt>
          <dd>{device.app || t("Не передано")}</dd>
        </div>
        <div>
          <dt>{t("Последнее подключение")}</dt>
          <dd>{formatDateTime(device.lastConnected)}</dd>
        </div>
        <div>
          <dt>{t("IP подключения")}</dt>
          <dd>{device.connectionIp || t("Пока нет")}</dd>
        </div>
        <div>
          <dt>{t("Обновление подписки")}</dt>
          <dd>{formatDateTime(device.lastSeen)}</dd>
        </div>
      </dl>
      <div className="device-actions">
        <button
          type="button"
          className={cn(device.blocked ? "secondary" : "danger")}
          disabled={isPending}
          onClick={() => onBlocked(!device.blocked)}
        >
          {t(device.blocked ? "Разрешить устройство" : "Отключить устройство")}
        </button>
        <button
          className="icon-btn danger"
          aria-label={t("Удалить запись устройства")}
          title={t("Удалить запись устройства")}
          disabled={isPending}
          onClick={() => {
            if (
              window.confirm(
                t(
                  "Удалить запись устройства? Сохранённый ключ будет отозван. При обновлении подписки устройство сможет зарегистрироваться заново.",
                ),
              )
            )
              onRemove();
          }}
        >
          <Trash2 width={24} height={24} aria-hidden />
        </button>
      </div>
    </section>
  );
}
