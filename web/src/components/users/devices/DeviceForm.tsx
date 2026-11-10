import { Notice } from "@/components/ui/feedback";
import { DeviceRow } from "@/components/users/devices/DeviceRow";
import { useDeviceCommands } from "@/hooks/users/devices/hooks";
import { MAX_USER_DEVICES, type IDevices } from "@/services/users/devices/types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function DeviceForm({ userId, data }: { userId: string; data: IDevices }) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(String(data.limit));
  const commands = useDeviceCommands(userId);
  const effectiveLimit = data.effectiveLimit ?? data.limit;
  const isPending = commands.limit.isPending || commands.edit.isPending || commands.remove.isPending;
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    commands.limit.mutate(Number(limit));
  }
  return (
    <div className="user-devices">
      {effectiveLimit !== data.limit && (
        <Notice>
          {t("Действующий лимит с учётом группы:")} {effectiveLimit}
        </Notice>
      )}
      <form onSubmit={onSubmit}>
        <label>
          {t("Лимит устройств")}
          <input
            aria-label={t("Лимит устройств")}
            aria-describedby="device-limit-help"
            type="number"
            min={0}
            max={MAX_USER_DEVICES}
            required
            value={limit}
            disabled={isPending}
            onChange={(event) => setLimit(event.target.value)}
          />
          <small id="device-limit-help">{t("0 отключает лимит. Учитываются устройства с подпиской.")}</small>
        </label>
        <button className="primary full" disabled={isPending}>
          {t(commands.limit.isPending ? "Сохраняем…" : "Сохранить лимит устройств")}
        </button>
      </form>
      <Notice>
        {t("После включения лимита обновите подписку в Happ. Одиночные ссылки перестанут работать.")}
      </Notice>
      <h3>
        {t("Зарегистрированные устройства")}{" "}
        <span className="user-count">{data.devices.filter((item) => !item.blocked).length}</span>
      </h3>
      {data.devices.length === 0 && (
        <p className="muted">{t("Устройства появятся после обновления подписки в Happ.")}</p>
      )}
      <div className="device-list">
        {data.devices.map((device) => (
          <DeviceRow
            key={device.id}
            device={device}
            isPending={isPending}
            onBlocked={(blocked) => commands.edit.mutate({ device: device.id, blocked })}
            onRemove={() => commands.remove.mutate(device.id)}
          />
        ))}
      </div>
      <p className="caption">
        {t("Модель и ОС сообщает приложение. Статус подключения обновляется автоматически.")}
      </p>
      {effectiveLimit === 0 && (
        <p className="caption">{t("Без лимита одиночные ссылки работают без определения устройства.")}</p>
      )}
    </div>
  );
}
