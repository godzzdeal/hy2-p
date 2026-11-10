import { Modal } from "@/components/ui/overlays/Modal";
import { PanelMaintenance } from "@/components/panel/maintenance/PanelMaintenance";
export function PanelUpdateDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Обновление панели" onClose={onClose}>
      <PanelMaintenance />
    </Modal>
  );
}
