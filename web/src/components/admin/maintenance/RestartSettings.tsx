import { SettingsSection } from "@/components/admin/SettingsSection";
import { RestartDialog } from "@/components/admin/maintenance/RestartDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function RestartSettings() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  return (
    <SettingsSection id="panel-maintenance" title={t("Обслуживание")}>
      <div className="form-body">
        <button type="button" className="secondary" onClick={() => setOpen(true)}>
          {t("Перезапустить панель")}
        </button>
      </div>
      {isOpen && <RestartDialog onClose={() => setOpen(false)} />}
    </SettingsSection>
  );
}
