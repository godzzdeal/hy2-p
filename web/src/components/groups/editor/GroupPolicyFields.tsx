import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { QueryState } from "@/components/ui/loading";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { CoreOption } from "@/components/users/access/CoreOption";
import { type useGroupForm } from "@/hooks/groups/use-group-form";
import { AccessMode } from "@/services/users/access/types";
import { MAX_USER_DEVICES } from "@/services/users/devices/types";
import { BYTE_UNITS } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";
export function GroupPolicyFields({ policy }: { policy: ReturnType<typeof useGroupForm>["policy"] }) {
  const { t } = useTranslation();
  const { access, eligible, isAll, isLoading, error, onMode, onToggle } = policy;
  return (
    <div className="group-policy grid gap-3">
      <Field>
        {t("Режим доступа к экземплярам")}
        <Select value={access.mode} onValueChange={onMode}>
          <SelectOption value={AccessMode.All}>{t("Все экземпляры, включая новые")}</SelectOption>
          <SelectOption value={AccessMode.Selected}>{t("Только выбранные экземпляры")}</SelectOption>
        </Select>
      </Field>
      <QueryState isLoading={isLoading} error={error} />
      <Fieldset>
        <legend>{t("Доступные экземпляры группы")}</legend>
        {eligible.map((instance) => (
          <CoreOption
            key={instance.id}
            instance={instance}
            isChecked={isAll || access.instances.includes(instance.id)}
            isDisabled={isAll}
            onToggle={onToggle}
          />
        ))}
      </Fieldset>
      <Field>
        {t("Лимит трафика на участника, ГБ")}
        <Input
          type="number"
          min={0}
          max={Number.MAX_SAFE_INTEGER / BYTE_UNITS.gigabyte}
          step="any"
          required
          {...policy.traffic}
        />
      </Field>
      <Field>
        {t("Лимит устройств на участника")}
        <Input type="number" min={0} max={MAX_USER_DEVICES} required {...policy.devices} />
      </Field>
      <Caption>
        {t(
          "0 отключает лимит группы. Личные ограничения продолжают действовать: применяется более строгий лимит и пересечение доступных экземпляров. Трафик участников не сбрасывается.",
        )}
      </Caption>
    </div>
  );
}
