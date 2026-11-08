import { Modal } from "@/components/ui/modal/Modal";
import { useTranslation } from "react-i18next";
export function YamlLoading({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal title="Редактор YAML" onClose={onClose}>
      <p role="status">{t("Открываем редактор…")}</p>
    </Modal>
  );
}
