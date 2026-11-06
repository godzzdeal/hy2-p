import { useTranslation } from "react-i18next";
import { lazy, Suspense } from "react";
import { type TUserDialog } from "./dialog-types";
const UserEditor = lazy(() => import("./dialogs/editor").then((module) => ({ default: module.UserEditor })));
const ConnectionDialog = lazy(() =>
  import("./dialogs/ConnectionDialog").then((module) => ({ default: module.ConnectionDialog })),
);
const DeleteDialog = lazy(() =>
  import("./dialogs/DeleteDialog").then((module) => ({ default: module.DeleteDialog })),
);
const TrafficDialog = lazy(() => import("./traffic").then((module) => ({ default: module.TrafficDialog })));
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
    </Suspense>
  );
}
