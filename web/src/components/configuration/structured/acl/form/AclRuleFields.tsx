import { Field } from "@/components/ui/fields/Field";
import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { Input } from "@/components/ui/fields/controls/Input";
import { FormSelect } from "@/components/ui/forms";
import { SelectOption } from "@/components/ui/select/SelectOption";
import type { useAclForm } from "@/hooks/configuration/acl";
import { ACL_ADDRESS_TYPES, ACL_ADDRESS_LABELS, ACL_PROTOCOLS } from "@/utils/configuration/structured/acl";
import { useTranslation } from "react-i18next";

export function AclRuleFields({
  editor,
  outbounds,
}: {
  editor: ReturnType<typeof useAclForm>;
  outbounds: string[];
}) {
  const { t } = useTranslation();
  const { form, values } = editor;
  const names = Array.from(new Set([...outbounds, values.outbound]));
  return (
    <FieldGrid columns={2} className="p-0">
      <Field>
        {t("Исходящее подключение")}
        <FormSelect control={form.control} name="outbound" label={t("Исходящее подключение")}>
          {names.map((name) => (
            <SelectOption key={name} value={name}>
              {name}
            </SelectOption>
          ))}
        </FormSelect>
      </Field>
      <Field>
        {t("Тип адреса")}
        <FormSelect control={form.control} name="addressType" label={t("Тип адреса")}>
          {ACL_ADDRESS_TYPES.map((type) => (
            <SelectOption key={type} value={type}>
              {t(ACL_ADDRESS_LABELS[type])}
            </SelectOption>
          ))}
        </FormSelect>
      </Field>
      <Field className="col-span-full">
        {t("Адрес правила")}
        <Input
          aria-label={t("Адрес правила")}
          readOnly={values.addressType === "all"}
          placeholder={values.addressType === "all" ? "all" : "example.com"}
          {...form.register("address", editor.addressRules)}
        />
      </Field>
      <Field>
        {t("Протокол")}
        <FormSelect control={form.control} name="protocol" label={t("Протокол")}>
          {ACL_PROTOCOLS.map((protocol) => (
            <SelectOption key={protocol} value={protocol}>
              {protocol === "*" ? t("Любой") : protocol.toUpperCase()}
            </SelectOption>
          ))}
        </FormSelect>
      </Field>
      <Field>
        {t("Порты")}
        <Input aria-label={t("Порты")} placeholder="443" {...form.register("ports", editor.portRules)} />
      </Field>
      <Field className="col-span-full">
        {t("Подменить адрес, необязательно")}
        <Input
          aria-label={t("Подменить адрес, необязательно")}
          placeholder="1.1.1.1"
          {...form.register("hijack", editor.hijackRules)}
        />
      </Field>
    </FieldGrid>
  );
}
