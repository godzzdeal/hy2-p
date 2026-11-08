import { FileCode2, History } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";
export function YamlLauncher({ onOpen, onHistory }: { onOpen: () => void; onHistory: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="card" id="config-yaml" data-scroll-section data-scroll-label={t("Редактор YAML")}>
      <div className="card-header">
        <div>
          <h2>{t("Редактор YAML")}</h2>
          <p className="muted">{t("Подсветка синтаксиса, поиск и проверка ошибок в отдельном окне.")}</p>
        </div>
        <div className="row-actions">
          <button type="button" className="secondary" onClick={onHistory}>
            <History width={24} height={24} aria-hidden />
            {t("История")}
          </button>
          <button type="button" className="primary" onClick={onOpen}>
            <FileCode2 width={24} height={24} aria-hidden />
            {t("Открыть редактор YAML")}
          </button>
        </div>
      </div>
    </section>
  );
}
