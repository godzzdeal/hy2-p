import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/ui";
export function YamlLoading({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal title="Редактор YAML" onClose={onClose}>
      <p role="status">{t("Открываем редактор…")}</p>
    </Modal>
  );
}
