import { useForm } from "react-hook-form";
import {
  EMPTY_ACL_RULE,
  parseAclRule,
  serializeAclRule,
  validateAclAddress,
  validateAclPorts,
  isIpAddress,
  type IAclRule,
} from "@/utils/configuration/structured/acl";
import { useTranslation } from "react-i18next";

export function useAclForm(source: string | undefined, onSave: (value: string) => void) {
  const { t } = useTranslation();
  const form = useForm<IAclRule>({
    defaultValues: source === undefined ? { ...EMPTY_ACL_RULE } : parseAclRule(source),
    mode: "onChange",
  });
  const values = form.watch();
  const addressRules = {
    validate: (value: string) =>
      form.getValues("mode") !== "rule" ||
      validateAclAddress(form.getValues("addressType"), value) ||
      t("Проверьте адрес и его тип в правиле ACL"),
  };
  const portRules = {
    validate: (value: string) =>
      form.getValues("mode") !== "rule" ||
      validateAclPorts(value) ||
      t("Порт: от 1 до 65535 или диапазон, например 80-443"),
  };
  const hijackRules = {
    validate: (value: string) =>
      form.getValues("mode") !== "rule" ||
      !value ||
      isIpAddress(value) ||
      t("Для подмены укажите IPv4 или IPv6 без порта"),
  };
  const textRules = {
    validate: (value: string) =>
      form.getValues("mode") === "rule" ||
      Boolean(value.trim()) ||
      t("Заполните поле «{{field}}».", { field: t("Текст ACL") }),
  };
  const preview = serializeAclRule(values);
  return {
    form,
    values,
    addressRules,
    portRules,
    hijackRules,
    textRules,
    preview,
    onSubmit: (value: IAclRule) => onSave(serializeAclRule(value)),
  };
}
