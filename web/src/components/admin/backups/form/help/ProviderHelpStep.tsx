import { useTranslation } from "react-i18next";

export function ProviderHelpStep({ text }: { text: string }) {
  const { t } = useTranslation();
  return <li className="pl-1">{t(text)}</li>;
}
