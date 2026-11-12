import { Field } from "@/components/ui/fields/Field";
import { Textarea } from "@/components/ui/fields/controls/Textarea";
import type { useAclForm } from "@/hooks/configuration/acl";
import { useTranslation } from "react-i18next";

export function AclTextFields({ editor }: { editor: ReturnType<typeof useAclForm> }) {
  const { t } = useTranslation();
  return (
    <Field>
      {t("Текст ACL")}
      <Textarea rows={6} aria-label={t("Текст ACL")} {...editor.form.register("text", editor.textRules)} />
    </Field>
  );
}
