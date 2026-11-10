import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
import { Trash2 } from "@/components/elements/icons";
import { ConnectionBadge } from "@/components/users/traffic/ConnectionBadge";
import { type IDevice } from "@/services/users/devices/types";
import { formatDateTime } from "@/utils/format-date";
import { useTranslation } from "react-i18next";
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
    <section className="device-row border border-line p-3 min-w-0" aria-label={device.model || device.id}>
      <div className="device-heading flex flex-wrap gap-2 justify-between">
        <strong>{device.model || device.os || t("Неизвестное устройство")}</strong>
        <ConnectionBadge
          online={device.online ?? 0}
          isAvailable={!!device.statusAvailable}
          isBlocked={device.blocked}
        />
      </div>
      <Caption>
        {device.os} {device.osVersion}
      </Caption>
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
      <div className="device-actions flex items-stretch gap-2">
        <Button
          className="h-auto min-w-0 flex-1 py-2 whitespace-normal"
          type="button"
          variant={device.blocked ? "secondary" : "danger"}
          disabled={isPending}
          onClick={() => onBlocked(!device.blocked)}
        >
          {t(device.blocked ? "Разрешить устройство" : "Отключить устройство")}
        </Button>
        <Button
          className="h-auto"
          variant="danger"
          size="icon"
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
        </Button>
      </div>
    </section>
  );
}
