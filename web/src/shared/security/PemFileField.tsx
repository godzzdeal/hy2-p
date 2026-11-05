import { useTranslation } from "react-i18next";
import { type ChangeEvent } from "react";
import { useUiStore } from "@/app/state";
const MAX_PEM_SIZE = 1 << 20;
export function PemFileField({ label, onChange }: { label: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const showError = useUiStore((state) => state.showError);
  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_PEM_SIZE) throw new Error(t("Файл сертификата слишком большой"));
      onChange(await file.text());
    } catch (error) {
      showError(error);
    }
  }
  return (
    <label>
      {t(label)}
      <input type="file" accept=".crt,.key,.pem,.cer" onChange={(event) => void onFile(event)} />
    </label>
  );
}
