import { useTranslation } from "react-i18next";
import { type IConfigSection } from "@/features/configuration/structured/model";
import { ConfigTab } from "./ConfigTab";
export function ConfigNavigation({
  sections,
  value,
  onSelect,
}: {
  sections: readonly IConfigSection[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <nav className="config-tabs" aria-label={t("Разделы конфигурации")}>
      {sections.map((section) => (
        <ConfigTab
          key={section.id}
          id={section.id}
          title={section.title}
          isSelected={value === section.id}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
