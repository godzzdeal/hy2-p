import { QueryState } from "@/components/ui/QueryState";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { CoreOption } from "@/components/users/access/CoreOption";
import { useInstances } from "@/hooks/instances/use-instances";
import { type IGroupInput } from "@/services/groups/types";
import { AccessMode } from "@/services/users/access/types";
import { MAX_USER_DEVICES } from "@/services/users/devices/types";
import { BYTE_UNITS } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";
export function GroupPolicyFields({
  value,
  onChange,
}: {
  value: IGroupInput;
  onChange: (value: IGroupInput) => void;
}) {
  const { t } = useTranslation();
  const cores = useInstances();
  const eligible =
    cores.data?.filter((core) => !core.removing && core.authMode !== "native" && !core.error) ?? [];
  const isAll = value.access.mode === AccessMode.All;
  function onToggle(id: string, isChecked: boolean) {
    onChange({
      ...value,
      access: {
        ...value.access,
        instances: isChecked
          ? [...value.access.instances, id]
          : value.access.instances.filter((item) => item !== id),
      },
    });
  }
  return (
    <div className="group-policy">
      <label>
        {t("Режим доступа к ядрам")}
        <Select
          value={value.access.mode}
          onValueChange={(mode) => {
            if (mode === AccessMode.All || mode === AccessMode.Selected)
              onChange({
                ...value,
                access: { mode, instances: mode === AccessMode.All ? [] : eligible.map((core) => core.id) },
              });
          }}
        >
          <SelectOption value={AccessMode.All}>{t("Все ядра, включая новые")}</SelectOption>
          <SelectOption value={AccessMode.Selected}>{t("Только выбранные ядра")}</SelectOption>
        </Select>
      </label>
      <QueryState isLoading={cores.isPending} error={cores.error} />
      <fieldset>
        <legend>{t("Доступные ядра группы")}</legend>
        {eligible.map((instance) => (
          <CoreOption
            key={instance.id}
            instance={instance}
            isChecked={isAll || value.access.instances.includes(instance.id)}
            isDisabled={isAll}
            onToggle={onToggle}
          />
        ))}
      </fieldset>
      <label>
        {t("Лимит трафика на участника, ГБ")}
        <input
          type="number"
          min={0}
          max={Number.MAX_SAFE_INTEGER / BYTE_UNITS.gigabyte}
          step="any"
          required
          value={value.trafficLimit / BYTE_UNITS.gigabyte}
          onChange={(event) =>
            onChange({ ...value, trafficLimit: Math.round(Number(event.target.value) * BYTE_UNITS.gigabyte) })
          }
        />
      </label>
      <label>
        {t("Лимит устройств на участника")}
        <input
          type="number"
          min={0}
          max={MAX_USER_DEVICES}
          required
          value={value.deviceLimit}
          onChange={(event) => onChange({ ...value, deviceLimit: Number(event.target.value) })}
        />
      </label>
      <p className="caption">
        {t(
          "0 отключает лимит группы. Личные ограничения продолжают действовать: применяется более строгий лимит и пересечение доступных ядер. Трафик участников не сбрасывается.",
        )}
      </p>
    </div>
  );
}
