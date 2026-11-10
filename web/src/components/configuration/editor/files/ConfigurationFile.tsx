import { useConfigurationFile } from "@/components/configuration/editor/files/use-configuration-file";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
import { FileDropzone } from "@/components/elements/upload";
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
    <div className="configuration-file">
      <FileDropzone
        label={t("Импорт YAML в черновик")}
        hint={t("YAML, до 1 МБ")}
        accept=".yaml,.yml,text/yaml,application/yaml"
        isBusy={read.isPending}
        onFile={(file) => read.mutate(file)}
      />
    </div>
  );
}
