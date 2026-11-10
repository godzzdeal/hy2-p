import { Modal } from "@/components/ui/modal/Modal";
import { Loader } from "@/components/ui/loading";
export function YamlLoading({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Редактор YAML" onClose={onClose}>
      <Loader label="Открываем редактор…" />
    </Modal>
  );
}
