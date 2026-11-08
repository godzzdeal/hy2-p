import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { type IDevices, MAX_USER_DEVICES, useDeviceCommands } from "./model";
import { DeviceRow } from "./DeviceRow";
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
        <p className="config-note">
          {t("Действующий лимит с учётом группы:")} {effectiveLimit}
        </p>
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
      <p className="config-note">
        {t("После включения лимита обновите подписку в Happ. Одиночные ссылки перестанут работать.")}
      </p>
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
