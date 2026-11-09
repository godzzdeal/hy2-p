import { useConfigurationFile } from "@/components/configuration/editor/files/use-configuration-file";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
export function ConfigurationFile({
  value,
  onChange,
}: {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const read = useConfigurationFile(value, onChange);
  return (
    <label className="configuration-file">
      {t("Импорт YAML в черновик")}
      <input
        type="file"
        accept=".yaml,.yml,text/yaml,application/yaml"
        disabled={read.isPending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) read.mutate(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}
