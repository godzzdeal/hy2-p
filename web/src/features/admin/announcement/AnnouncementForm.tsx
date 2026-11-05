import { ProfileFields, PROFILE_TITLE_LIMIT } from "./profile";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { type FormEvent } from "react";
import { ANNOUNCEMENT_LIMIT, MAX_UPDATE_HOURS, useSaveAnnouncement } from "./model";
import { type IAnnouncement } from "./model";
export function AnnouncementForm({ initial }: { initial: IAnnouncement }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const mutation = useSaveAnnouncement();
  const count = Array.from(draft.text).length;
  const titleCount = Array.from(draft.profileTitle ?? "").length;
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (count <= ANNOUNCEMENT_LIMIT && titleCount <= PROFILE_TITLE_LIMIT) mutation.mutate(draft);
  }
  return (
    <form className="card settings-form" onSubmit={onSubmit}>
      <div className="card-header">
        <h2>{t("Подписка Happ")}</h2>
      </div>
      <div className="form-body">
        <ProfileFields
          value={draft.profileTitle ?? ""}
          onChange={(profileTitle) => setDraft({ ...draft, profileTitle })}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
          />
          {t("Показывать объявление в подписках")}
        </label>
        <label>
          {t("Текст объявления")}
          <textarea
            rows={3}
            required={draft.enabled}
            value={draft.text}
            aria-describedby="announcement-count"
            onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          />
          <small id="announcement-count" role="status">
            {count} / {ANNOUNCEMENT_LIMIT}
          </small>
        </label>
        <label>
          {t("Обновление подписки (часы)")}
          <input
            type="number"
            min={1}
            max={MAX_UPDATE_HOURS}
            step={1}
            required
            value={draft.updateInterval}
            onChange={(event) => setDraft({ ...draft, updateInterval: Number(event.target.value) })}
          />
        </label>
        <p className="caption">
          {t(
            "Happ показывает объявление после обновления подписки. Это не push-уведомление; фоновое обновление зависит от приложения и ОС.",
          )}
        </p>
        <p className="caption">
          {t(
            "Сообщение получат пользователи подписки. При импорте только ссылки сервера объявление не передаётся.",
          )}
        </p>
        <button
          className="primary"
          disabled={mutation.isPending || count > ANNOUNCEMENT_LIMIT || titleCount > PROFILE_TITLE_LIMIT}
        >
          {t("Сохранить настройки подписки")}
        </button>
      </div>
    </form>
  );
}
