import { FileDropzone } from "@/components/elements/upload";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import type { useAclSource } from "@/hooks/configuration/acl";
import type { TAclFileKind } from "@/services/configuration/tools";
import { useTranslation } from "react-i18next";

export function AclSourceInputs({
  kind,
  source,
}: {
  kind: TAclFileKind;
  source: ReturnType<typeof useAclSource>;
}) {
  const { t } = useTranslation();
  if (source.mode === "upload")
    return (
      <FileDropzone
        label={"acl." + kind}
        accept={kind === "file" ? ".txt,.acl,.conf" : ".dat"}
        hint={kind === "file" ? t("UTF-8, до 1 МБ") : undefined}
        isBusy={source.isPending}
        onFile={source.onFile}
      />
    );
  return (
    <div className="grid min-w-0 gap-2">
      <Field>
        {t("Прямая ссылка")}
        <Input
          aria-label={t("Ссылка {{field}}", { field: "acl." + kind })}
          type="url"
          value={source.url}
          placeholder="https://example.com/file.dat"
          disabled={source.isPending}
          onChange={(event) => source.setUrl(event.target.value)}
        />
      </Field>
      <Button
        type="button"
        className="justify-self-start"
        disabled={source.isPending || !source.url.trim()}
        onClick={source.onDownload}
      >
        {t(source.isPending ? "Загружаем…" : "Скачать")}
      </Button>
    </div>
  );
}
