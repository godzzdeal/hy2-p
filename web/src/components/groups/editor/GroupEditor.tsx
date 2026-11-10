import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { GroupColorPicker } from "@/components/groups/editor/GroupColorPicker";
import { GroupPolicyFields } from "@/components/groups/editor/GroupPolicyFields";
import { useGroupForm } from "@/hooks/groups/use-group-form";
import { type IGroup } from "@/services/groups/types";
import { Form } from "@/components/ui/forms";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
export function GroupEditor({ group, onClose }: { group?: IGroup; onClose: () => void }) {
  const { t } = useTranslation();
  const { form, policy, isPending, onSubmit } = useGroupForm(group, onClose);
  return (
    <Form form={form} className="group-editor" onSubmit={onSubmit}>
      <Fieldset disabled={isPending}>
        <legend>{t(group ? "Редактировать группу" : "Новая группа")}</legend>
        <Field>
          {t("Название группы")}
          <Input
            required
            maxLength={100}
            {...form.register("name", { required: t("Заполните это поле"), maxLength: 100 })}
          />
        </Field>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => <GroupColorPicker value={field.value} onChange={field.onChange} />}
        />
        <GroupPolicyFields policy={policy} />
      </Fieldset>
      <Actions>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
          {t("Назад")}
        </Button>
        <Button variant="primary" disabled={isPending}>
          {t(isPending ? "Сохраняем…" : "Сохранить группу")}
        </Button>
      </Actions>
    </Form>
  );
}
