import { useTranslation } from "react-i18next";
import { ArrowUpRight, ShieldCheck, Undo2 } from "lucide-react";
import { CoreStatusCard, CoreLog } from "./status";
import { UpdateCard } from "./versions";
export function CorePage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("СИСТЕМА / HYSTERIA 2")}</span>
          <h1>{t("Ядро под контролем")}</h1>
          <p>{t("Состояние сервера, проверенные обновления и быстрый откат.")}</p>
        </div>
        <a
          className="documentation-link"
          href="https://v2.hysteria.network/docs/"
          target="_blank"
          rel="noreferrer"
        >
          {t("Документация")}
          <ArrowUpRight size={20} aria-hidden />
        </a>
      </div>
      <CoreStatusCard />
      <div
        className="engine-grid"
        id="core-versions"
        data-scroll-section
        data-scroll-label={t("Обновление ядра")}
      >
        <UpdateCard />
        <div className="engine-details">
          <section className="card safety-card">
            <ShieldCheck size={24} aria-hidden />
            <h2>
              {t("Сначала проверка.")}
              <br />
              {t("Потом переключение.")}
            </h2>
            <p>
              {t(
                "Файл загружается с официального GitHub и сверяется с SHA-256. Предыдущее ядро продолжает работать до завершения загрузки.",
              )}
            </p>
            <div className="safety-divider" />
            <Undo2 size={24} aria-hidden />
            <h3>{t("Вернуться можно")}</h3>
            <p>
              {t(
                "Предыдущая версия сохраняется. При неудачном запуске панель выполняет откат и показывает причину.",
              )}
            </p>
          </section>
        </div>
      </div>
      <CoreLog />
    </>
  );
}
