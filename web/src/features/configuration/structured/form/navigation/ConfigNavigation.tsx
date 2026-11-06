import { useTranslation } from "react-i18next";
import { Select } from "@/shared/ui/select";
import { type IConfigSection } from "@/features/configuration/structured/model";
import { ConfigTab } from "./ConfigTab";
import { ConfigOption } from "./ConfigOption";
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
    <>
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
      <label className="config-mobile-menu">
        {t("Раздел конфигурации")}
        <Select value={value} onValueChange={onSelect}>
          {sections.map((section) => (
            <ConfigOption key={section.id} section={section} />
          ))}
        </Select>
      </label>
    </>
  );
}
