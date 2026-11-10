import { Notice } from "@/components/ui/feedback";
import { useTranslation } from "react-i18next";

export function CompatibilityNotice({ isVisible = true }: { isVisible?: boolean }) {
  const { t } = useTranslation();
  if (!isVisible) return null;
  return (
    <Notice>
      {t(
        "Happ для Windows 4.7.2 не сохраняет ECH из HY2-ссылок. Соединение может работать без ECH. pinSHA256 импортируется.",
      )}
    </Notice>
  );
}
