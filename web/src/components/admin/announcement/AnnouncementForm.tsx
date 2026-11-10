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
        <div className="form-body">
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
          <p className="caption">
            {t(
              "Используется в панели и подписках, если у пользователя не выбран свой флаг. Имена пользователей сохраняются. После изменения обновите подписку в Happ.",
            )}
          </p>
          <label className="checkbox">
            <input type="checkbox" {...form.register("enabled")} />
            {t("Показывать объявление в подписках")}
          </label>
          <label>
            {t("Текст объявления")}
            <textarea
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
          </label>
          <label>
            {t("Обновлять подписку каждые (часов)")}
            <input
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
          </label>
          <p className="caption">
            {t("Сообщение появится в Happ после обновления подписки. Мгновенной рассылки нет.")}
          </p>
          <p className="caption">
            {t("При добавлении только отдельной ссылки сервера сообщение не передаётся.")}
          </p>
          <button className="primary" disabled={isPending || isTooLong}>
            {t("Сохранить настройки подписки")}
          </button>
        </div>
      </Form>
    </SettingsSection>
  );
}
