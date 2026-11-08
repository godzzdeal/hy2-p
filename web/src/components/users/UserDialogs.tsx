import { type TUserDialog } from "@/services/users/dialog-types";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
const UserEditor = lazy(() =>
  import("@/components/users/dialogs/editor/UserEditor").then((module) => ({ default: module.UserEditor })),
);
const ConnectionDialog = lazy(() =>
  import("@/components/users/dialogs/ConnectionDialog").then((module) => ({
    default: module.ConnectionDialog,
  })),
);
const DeleteDialog = lazy(() =>
  import("@/components/users/dialogs/DeleteDialog").then((module) => ({ default: module.DeleteDialog })),
);
const TrafficDialog = lazy(() =>
  import("@/components/users/traffic/editor/TrafficDialog").then((module) => ({
    default: module.TrafficDialog,
  })),
);
const UserAccessDialog = lazy(() =>
  import("@/components/users/access/UserAccessDialog").then((module) => ({
    default: module.UserAccessDialog,
  })),
);
const DevicesDialog = lazy(() =>
  import("@/components/users/devices/DevicesDialog").then((module) => ({ default: module.DevicesDialog })),
);
export function UserDialogs({ dialog, onClose }: { dialog: TUserDialog; onClose: () => void }) {
  const { t } = useTranslation();
  if (!dialog) return null;
  return (
    <Suspense fallback={<p role="status">{t("Загрузка формы\u2026")}</p>}>
      {dialog.type === "create" && <UserEditor onClose={onClose} />}{" "}
      {dialog.type === "edit" && <UserEditor user={dialog.user} onClose={onClose} />}{" "}
      {dialog.type === "share" && <ConnectionDialog user={dialog.user} onClose={onClose} />}{" "}
      {dialog.type === "delete" && <DeleteDialog user={dialog.user} onClose={onClose} />}{" "}
      {dialog.type === "traffic" && <TrafficDialog user={dialog.user} onClose={onClose} />}
      {dialog.type === "access" && <UserAccessDialog user={dialog.user} onClose={onClose} />}
      {dialog.type === "devices" && <DevicesDialog user={dialog.user} onClose={onClose} />}
    </Suspense>
  );
}
