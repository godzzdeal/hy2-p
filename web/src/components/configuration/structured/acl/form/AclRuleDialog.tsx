import { Modal } from "@/components/ui/overlays/Modal";
import { Form, FormSelect } from "@/components/ui/forms";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { Field } from "@/components/ui/fields/Field";
import { Button } from "@/components/ui/button/Button";
import { useAclForm } from "@/hooks/configuration/acl";
import { ACL_MODES, ACL_MODE_LABELS } from "@/utils/configuration/structured/acl";
import { AclRuleFields } from "./AclRuleFields";
import { AclTextFields } from "./AclTextFields";
import { useTranslation } from "react-i18next";

export function AclRuleDialog({
  source,
  outbounds,
  onSave,
  onClose,
}: {
  source?: string;
  outbounds: string[];
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const editor = useAclForm(source, onSave);
  return (
    <Modal
      title={source === undefined ? "Новое правило ACL" : "Изменить правило ACL"}
      onClose={onClose}
      className="max-w-2xl"
    >
      <Form form={editor.form} onSubmit={editor.onSubmit}>
        <Field>
          {t("Тип записи")}
          <FormSelect control={editor.form.control} name="mode" label={t("Тип записи")}>
            {ACL_MODES.map((mode) => (
              <SelectOption key={mode} value={mode}>
                {t(ACL_MODE_LABELS[mode])}
              </SelectOption>
            ))}
          </FormSelect>
        </Field>
        {editor.values.mode === "rule" ? (
          <AclRuleFields editor={editor} outbounds={outbounds} />
        ) : (
          <AclTextFields editor={editor} />
        )}
        <div className="grid min-w-0 gap-2 border-2 border-line bg-input p-4">
          <strong>{t("Результат")}</strong>
          <code
            className="whitespace-pre-wrap wrap-anywhere text-lg font-sans"
            aria-label={t("Результат правила ACL")}
          >
            {editor.preview}
          </code>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("Отменить")}
          </Button>
          <Button variant="primary">{t("Сохранить")}</Button>
        </div>
      </Form>
    </Modal>
  );
}
