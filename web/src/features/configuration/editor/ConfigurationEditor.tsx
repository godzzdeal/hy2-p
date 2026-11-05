import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { FormEvent } from "react";
import { ConfigurationForm } from "@/features/configuration/structured";
import { History } from "lucide-react";
import type { IConfiguration } from "@/features/configuration/model";
import { useSaveConfiguration } from "@/features/configuration/model";
import { ConnectionFields } from "./ConnectionFields";
import { HistoryDialog } from "./HistoryDialog";
export function ConfigurationEditor({ initial }: { initial: IConfiguration }) {
  const { t } = useTranslation();
  // An explicit unsaved form draft; the server cache remains owned by TanStack Query.
  const [draft, setDraft] = useState(initial);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const save = useSaveConfiguration();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(draft);
  }
  function onRestore(value: IConfiguration) {
    setDraft(value);
    setHistoryOpen(false);
  }
  return (
    <>
      <form onSubmit={onSubmit}>
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
            <button type="button" className="text-btn" onClick={() => setHistoryOpen(true)}>
              <History size={16} aria-hidden />
              {t("История")}
            </button>
          </div>
          <p className="config-note">
            {t(
              "Все поля сохраняются. В управляемом режиме auth задаёт панель; в нативном используется выбранный auth. trafficStats обслуживает статистику и watchdog.",
            )}
          </p>
          <textarea
            spellCheck={false}
            aria-label={t("Конфигурация Hysteria2 YAML")}
            className="code-editor"
            value={draft.config}
            onChange={(event) => setDraft({ ...draft, config: event.target.value })}
          />
          <div className="config-footer">
            <span>{t("Изменения применяются после перезапуска ядра.")}</span>
            <button className="primary" disabled={save.isPending}>
              {save.isPending ? t("Сохраняем\u2026") : t("Сохранить конфигурацию")}
            </button>
          </div>
        </section>
      </form>
      {isHistoryOpen && <HistoryDialog onClose={() => setHistoryOpen(false)} onRestore={onRestore} />}
    </>
  );
}
