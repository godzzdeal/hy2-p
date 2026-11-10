import { Caption } from "@/components/elements/Caption";
import { CardBody } from "@/components/ui/cards/CardBody";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Textarea } from "@/components/ui/fields/controls/Textarea";
import { Button } from "@/components/ui/button/Button";
import { ProfileFields } from "@/components/admin/announcement/profile/ProfileFields";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { FlagPicker } from "@/components/elements/flags/select/FlagPicker";
import { useAnnouncementForm } from "@/hooks/admin/forms";
import { Form } from "@/components/ui/forms";
import { ANNOUNCEMENT_LIMIT, MAX_UPDATE_HOURS, type IAnnouncement } from "@/services/admin/announcement";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
export function AnnouncementForm({ initial }: { initial: IAnnouncement }) {
  const { t } = useTranslation();
  const { form, count, isEnabled, isPending, isTooLong, onSubmit } = useAnnouncementForm(initial);
  return (
    <SettingsSection id="subscription-settings" title={t("Подписка")}>
      <Form form={form} className="settings-form" onSubmit={onSubmit}>
        <CardBody>
          <Controller
            control={form.control}
            name="profileTitle"
            render={({ field }) => <ProfileFields value={field.value ?? ""} onChange={field.onChange} />}
          />
          <Controller
            control={form.control}
            name="defaultUserFlag"
            render={({ field }) => (
              <FlagPicker
                label="Общий флаг пользователей"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
          <Caption>
            {t(
              "Используется в панели и подписках, если у пользователя не выбран свой флаг. Имена пользователей сохраняются. После изменения обновите подписку в Happ.",
            )}
          </Caption>
          <Field isInline>
            <Input type="checkbox" {...form.register("enabled")} />
            {t("Показывать объявление в подписках")}
          </Field>
          <Field>
            {t("Текст объявления")}
            <Textarea
              aria-label={t("Текст объявления")}
              rows={3}
              required={isEnabled}
              aria-describedby="announcement-count"
              {...form.register("text", {
                validate: (value) => !isEnabled || !!value.trim() || t("Заполните это поле"),
              })}
            />
            <small id="announcement-count" role="status">
              {count} / {ANNOUNCEMENT_LIMIT}
            </small>
          </Field>
          <Field>
            {t("Обновлять подписку каждые (часов)")}
            <Input
              type="number"
              min={1}
              max={MAX_UPDATE_HOURS}
              step={1}
              required
              {...form.register("updateInterval", {
                valueAsNumber: true,
                required: true,
                min: 1,
                max: MAX_UPDATE_HOURS,
              })}
            />
          </Field>
          <Caption>
            {t("Сообщение появится в Happ после обновления подписки. Мгновенной рассылки нет.")}
          </Caption>
          <Caption>{t("При добавлении только отдельной ссылки сервера сообщение не передаётся.")}</Caption>
          <Button variant="primary" disabled={isPending || isTooLong}>
            {t("Сохранить настройки подписки")}
          </Button>
        </CardBody>
      </Form>
    </SettingsSection>
  );
}
