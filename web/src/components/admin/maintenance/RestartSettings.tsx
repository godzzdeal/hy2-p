import { CardBody } from "@/components/ui/cards/CardBody";
import { Button } from "@/components/ui/button/Button";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { RestartDialog } from "@/components/admin/maintenance/RestartDialog";
import { PanelMaintenance } from "@/components/panel/maintenance";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function RestartSettings() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  return (
    <SettingsSection id="panel-maintenance" title={t("Обслуживание")}>
      <CardBody>
        <PanelMaintenance />
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          {t("Перезапустить панель")}
        </Button>
      </CardBody>
      {isOpen && <RestartDialog onClose={() => setOpen(false)} />}
    </SettingsSection>
  );
}
