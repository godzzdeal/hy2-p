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
      <div className="field-grid">
        <label>
          {t("Порт")}
          <input
            type="number"
            min={1}
            max={65535}
            required
            {...form.register("port", { valueAsNumber: true, required: true, min: 1, max: 65535 })}
            disabled={isPending}
          />
        </label>
        <label>
          {t("Протокол")}
          <FormSelect control={form.control} name="protocol" label={t("Протокол")} disabled={isPending}>
            <SelectOption value="tcp">TCP</SelectOption>
            <SelectOption value="udp">UDP</SelectOption>
          </FormSelect>
        </label>
        <label>
          {t("Действие")}
          <FormSelect control={form.control} name="action" label={t("Действие")} disabled={isPending}>
            <SelectOption value="allow">{t("Открыть порт")}</SelectOption>
            <SelectOption value="deny">{t("Закрыть порт")}</SelectOption>
          </FormSelect>
        </label>
      </div>
      <button className="primary" disabled={isPending}>
        {t(isPending ? "Применяем…" : "Применить правило")}
      </button>
    </Form>
  );
}
