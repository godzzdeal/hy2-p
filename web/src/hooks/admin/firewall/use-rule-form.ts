import { type IPortRule } from "@/services/admin/firewall/api";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export function useRuleForm(onApply: (rule: IPortRule) => void) {
  const { t } = useTranslation();
  const form = useForm<IPortRule>({ defaultValues: { port: 0, protocol: "tcp", action: "allow" } });
  function onSubmit(value: IPortRule) {
    if (
      value.action === "deny" &&
      !window.confirm(t("Закрыть порт? Существующие подключения могут прерваться."))
    )
      return;
    onApply(value);
  }
  return { form, onSubmit };
}
