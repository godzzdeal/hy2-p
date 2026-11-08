import { InstallButton } from "@/components/elements/install/InstallButton";
import { InstallHelp } from "@/components/elements/install/InstallHelp";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function InstallCard() {
  const { t } = useTranslation();
  const [isHelpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <section
        className="card settings-form"
        id="install-panel"
        data-scroll-section
        data-scroll-label={t("Панель на телефоне")}
      >
        <div className="card-header">
          <h2>{t("Панель на телефоне")}</h2>
        </div>
        <div className="form-body">
          <p>
            {t("Добавьте панель на главный экран. Она будет открываться в отдельном окне, как приложение.")}
          </p>
          <InstallButton onHelp={() => setHelpOpen(true)} />
        </div>
      </section>
      {isHelpOpen && <InstallHelp onClose={() => setHelpOpen(false)} />}
    </>
  );
}
