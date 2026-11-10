import { readPemFile } from "@/utils/security";
import { FileDropzone } from "@/components/elements/upload";
import { useTranslation } from "react-i18next";
export function PemFileField({ label, onChange }: { label: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  async function onFile(file: File) {
    onChange(await readPemFile(file));
  }
  return (
    <FileDropzone
      label={t(label)}
      hint={t("PEM, CRT, CER или KEY, до 1 МБ")}
      accept=".crt,.key,.pem,.cer"
      onFile={onFile}
    />
  );
}
