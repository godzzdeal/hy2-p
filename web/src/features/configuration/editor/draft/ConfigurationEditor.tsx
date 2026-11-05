import { useTranslation } from "react-i18next";
import { useState } from "react";
import { History } from "lucide-react";
import { ConfigurationForm } from "@/features/configuration/structured";
import { type IConfiguration } from "@/features/configuration/model";
import { ConnectionFields } from "../ConnectionFields";
import { HistoryDialog } from "../HistoryDialog";
import { DraftBar } from "./DraftBar";
import { useConfigurationDraft } from "./use-configuration-draft";
export function ConfigurationEditor({ initial }: { initial: IConfiguration }) {
  const { t } = useTranslation();
  const { draft, setDraft, isDirty, isPending, onOrder, onSave, onReset } = useConfigurationDraft(initial);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  function onRestore(value: IConfiguration) {
    setDraft(value);
    setHistoryOpen(false);
  }
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <ConnectionFields value={draft} onChange={setDraft} />
        <ConfigurationForm value={draft} onChange={setDraft} />
        <section
          className="card config-card"
          id="config-yaml"
          data-scroll-section
          data-scroll-label={t("Расширенный редактор YAML")}
        >
          <div className="card-header">
            <h2>{t("Расширенный редактор YAML")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="text-btn" onClick={onOrder}>
                {t("Упорядочить YAML")}
              </button>
              <button type="button" className="text-btn" onClick={() => setHistoryOpen(true)}>
                <History size={16} aria-hidden />
                {t("История")}
              </button>
            </div>
          </div>
          <p className="config-note">
            {t(
              "Порядок полей соответствует документации Hysteria2. Неизвестные поля и комментарии сохраняются.",
            )}
          </p>
          <details className="yaml-details">
            <summary>{t("Открыть редактор YAML")}</summary>
            <textarea
              spellCheck={false}
              aria-label={t("Конфигурация Hysteria2 YAML")}
              className="code-editor"
              value={draft.config}
              onChange={(event) => setDraft({ ...draft, config: event.target.value })}
            />
          </details>
        </section>
        <DraftBar isDirty={isDirty} isPending={isPending} onReset={onReset} />
      </form>
      {isHistoryOpen && <HistoryDialog onClose={() => setHistoryOpen(false)} onRestore={onRestore} />}
    </>
  );
}
