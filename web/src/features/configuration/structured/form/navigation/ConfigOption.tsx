import { useTranslation } from "react-i18next";
import { SelectOption } from "@/shared/ui/select";
import { type IConfigSection } from "@/features/configuration/structured/model";
export function ConfigOption({ section }: { section: IConfigSection }) {
  const { t } = useTranslation();
  return <SelectOption value={section.id}>{t(section.title)}</SelectOption>;
}
