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
    <div className="configuration-navigation min-w-0 self-stretch bg-surface">
      <nav
        className="config-tabs flex flex-col self-start sticky top-4 overflow-y-auto gap-1 scrollbar-stable max-desktop:static max-desktop:flex-row max-desktop:min-w-0 max-desktop:max-w-full max-desktop:py-1 max-desktop:px-2 max-desktop:overflow-x-auto max-desktop:overflow-y-hidden max-desktop:scrollbar-thin max-desktop:border-b max-desktop:border-line"
        aria-label={t("Разделы конфигурации")}
      >
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
