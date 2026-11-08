import { ConfigTab } from "@/components/configuration/structured/form/navigation/ConfigTab";
import { type IConfigSection } from "@/services/configuration/structured/field-types";
import { useTranslation } from "react-i18next";
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
    <div className="configuration-navigation">
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
    </div>
  );
}
