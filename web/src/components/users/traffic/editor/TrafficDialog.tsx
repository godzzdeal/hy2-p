import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { Modal } from "@/components/ui/modal/Modal";
import { QueryState } from "@/components/ui/QueryState";
import { TrafficForm } from "@/components/users/traffic/editor/TrafficForm";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { EMPTY_USAGE } from "@/services/users/traffic/traffic-types";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export function TrafficDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useTraffic();
  return (
    <Modal
      title={t("Трафик: ") + user.name}
      heading={
        <>
          {t("Трафик: ")}
          <EmojiText value={user.name} />
        </>
      }
      onClose={onClose}
    >
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && (
        <TrafficForm user={user} usage={query.data.users[user.id] ?? EMPTY_USAGE} onClose={onClose} />
      )}
    </Modal>
  );
}
