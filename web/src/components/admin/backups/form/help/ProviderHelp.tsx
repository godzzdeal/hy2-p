import { useTranslation } from "react-i18next";
import { FieldInfo } from "@/components/ui/fields/information";
import { ProviderHelpStep } from "@/components/admin/backups/form/help/ProviderHelpStep";
import { PROVIDER_GUIDES } from "@/components/admin/backups/form/help/provider-guides";
import type { TStorageProvider } from "@/services/admin/storage";

export function ProviderHelp({ provider }: { provider: TStorageProvider }) {
  const { t } = useTranslation();
  const guide = PROVIDER_GUIDES[provider];
  if (!guide) return null;
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <a
        href={guide.consoleURL}
        title={guide.consoleName}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 text-accent underline underline-offset-4 wrap-anywhere"
      >
        {t("Получить ключи")}
      </a>
      <FieldInfo
        label={t("Как получить Client ID и Client Secret")}
        aria-label={t("Как получить Client ID и Client Secret")}
      >
        <ol className="grid list-decimal gap-3 pl-6">
          {guide.steps.map((step) => (
            <ProviderHelpStep key={step} text={step} />
          ))}
        </ol>
        <a
          href={guide.documentationURL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4"
        >
          {t("Документация сервиса")}
        </a>
      </FieldInfo>
    </div>
  );
}
