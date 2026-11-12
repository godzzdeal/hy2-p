import { Notice } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

export function AclFileNotice({ onInline }: { onInline: () => void }) {
  const { t } = useTranslation();
  return (
    <Notice variant="warning">
      <div className="grid gap-3">
        <p className="m-0">{t("Указан acl.file. Встроенные правила не используются, пока выбран файл.")}</p>
        <Button type="button" variant="outline" onClick={onInline}>
          {t("Использовать acl.inline")}
        </Button>
      </div>
    </Notice>
  );
}
