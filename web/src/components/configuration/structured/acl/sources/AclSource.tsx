import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import {
  ACL_SOURCE_MODES,
  ACL_SOURCE_LABELS,
  useAclSource,
  type TAclSourceMode,
} from "@/hooks/configuration/acl";
import type { TAclFileKind } from "@/services/configuration/tools";
import { AclSourceInputs } from "./AclSourceInputs";
import { useTranslation } from "react-i18next";
import { useId } from "react";
import { ConfigProperty } from "@/components/configuration/structured/ConfigProperty";

export function AclSource({
  kind,
  value,
  onSet,
}: {
  kind: TAclFileKind;
  value: string;
  onSet: (path: string, value: unknown) => void;
}) {
  const { t } = useTranslation();
  const source = useAclSource(kind, onSet);
  const id = useId();
  const path = "acl." + kind;
  return (
    <section className="grid min-w-0 gap-3 border-2 border-line bg-input p-4" aria-label={path}>
      <ConfigProperty
        path={path}
        htmlFor={id}
        canReset={!!value && !source.isPending}
        onReset={() => onSet(path, undefined)}
      />
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <Field>
          {t("Источник")}
          <Select
            aria-label={t("Источник {{field}}", { field: path })}
            value={source.mode}
            disabled={source.isPending}
            onValueChange={(mode) => source.setMode(mode as TAclSourceMode)}
          >
            {ACL_SOURCE_MODES.map((mode) => (
              <SelectOption key={mode} value={mode}>
                {t(ACL_SOURCE_LABELS[mode])}
              </SelectOption>
            ))}
          </Select>
        </Field>
        <Field>
          {t("Путь на сервере")}
          <Input
            id={id}
            aria-label={path}
            value={value}
            placeholder={kind === "file" ? "/data/acl-files/rules.txt" : "/data/acl-files/" + kind + ".dat"}
            disabled={source.isPending}
            onChange={(event) => onSet(path, event.target.value)}
          />
        </Field>
      </div>
      {source.mode !== "path" && <AclSourceInputs kind={kind} source={source} />}
      <small className="text-muted">
        {t(
          kind === "file"
            ? "Текстовый файл с правилами ACL. Он заменяет встроенный список правил."
            : "Пустой путь включает стандартную базу Hysteria2.",
        )}
      </small>
    </section>
  );
}
