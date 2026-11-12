import { SettingsSection } from "@/components/admin/SettingsSection";
import { BackupContent } from "@/components/admin/backups/BackupContent";
import { useTranslation } from "react-i18next";
export function BackupSettings() {
  const { t } = useTranslation();
  return (
    <SettingsSection id="panel-backups" title={t("Резервные копии")}>
      <BackupContent />
    </SettingsSection>
  );
}
