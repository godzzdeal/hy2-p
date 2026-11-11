import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Form, FormSelect } from "@/components/ui/forms";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IPortRule } from "@/services/admin/firewall/api";
import { useRuleForm } from "@/hooks/admin/firewall/use-rule-form";
import { useTranslation } from "react-i18next";
export function PortRuleForm({
  isPending,
  onApply,
}: {
  isPending: boolean;
  onApply: (rule: IPortRule) => void;
}) {
  const { t } = useTranslation();
  const { form, onSubmit } = useRuleForm(onApply);
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FieldGrid>
        <Field>
          {t("Порт")}
          <Input
            type="number"
            min={1}
            max={65535}
            required
            {...form.register("port", {
              valueAsNumber: true,
              required: true,
              min: 1,
              max: 65535,
            })}
            disabled={isPending}
          />
        </Field>
        <Field>
          {t("Протокол")}
          <FormSelect control={form.control} name="protocol" label={t("Протокол")} disabled={isPending}>
            <SelectOption value="tcp">TCP</SelectOption>
            <SelectOption value="udp">UDP</SelectOption>
          </FormSelect>
        </Field>
        <Field>
          {t("Действие")}
          <FormSelect control={form.control} name="action" label={t("Действие")} disabled={isPending}>
            <SelectOption value="allow">{t("Открыть порт")}</SelectOption>
            <SelectOption value="deny">{t("Закрыть порт")}</SelectOption>
          </FormSelect>
        </Field>
      </FieldGrid>
      <Button aria-label={t("Применить правило")} variant="primary" disabled={isPending}>
        {t(isPending ? "Применяем…" : "Применить")}
      </Button>
    </Form>
  );
}
