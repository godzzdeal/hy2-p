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
      <fieldset disabled={isPending}>
        <legend>{t(group ? "Редактировать группу" : "Новая группа")}</legend>
        <label>
          {t("Название группы")}
          <input
            required
            maxLength={100}
            {...form.register("name", { required: t("Заполните это поле"), maxLength: 100 })}
          />
        </label>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => <GroupColorPicker value={field.value} onChange={field.onChange} />}
        />
        <GroupPolicyFields policy={policy} />
      </fieldset>
      <div className="row-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={isPending}>
          {t("Назад")}
        </button>
        <button className="primary" disabled={isPending}>
          {t(isPending ? "Сохраняем…" : "Сохранить группу")}
        </button>
      </div>
    </Form>
  );
}
