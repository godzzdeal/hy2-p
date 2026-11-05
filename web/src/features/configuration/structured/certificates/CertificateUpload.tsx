import { useTranslation } from "react-i18next";
import { useState } from "react";
import { type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { certificateApi } from "@/features/configuration/structured/model/certificate-api";
import { useUiStore } from "@/app/state";
const MAX_PEM_FILE = 1 << 20;
export function CertificateUpload({ onUploaded }: { onUploaded: (cert: string, key: string) => void }) {
  const { t } = useTranslation();
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const showError = useUiStore((state) => state.showError);
  const mutation = useMutation({
    mutationFn: certificateApi.upload,
    onSuccess: (result) => {
      onUploaded(result.certificatePath, result.keyPath);
      setPrivateKey("");
    },
    onError: showError,
  });
  async function onFile(event: ChangeEvent<HTMLInputElement>, target: "cert" | "key") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_PEM_FILE) throw new Error(t("Файл сертификата слишком большой"));
      const text = await file.text();
      if (target === "cert") setCertificate(text);
      else setPrivateKey(text);
    } catch (error) {
      showError(error);
    }
  }
  return (
    <div className="certificate-upload">
      <label>
        {t("Сертификат PEM")}
        <input type="file" accept=".crt,.pem,.cer" onChange={(event) => void onFile(event, "cert")} />
      </label>
      <label>
        {t("Приватный ключ PEM")}
        <input type="file" accept=".key,.pem" onChange={(event) => void onFile(event, "key")} />
      </label>
      <button
        type="button"
        className="secondary"
        disabled={!certificate || !privateKey || mutation.isPending}
        onClick={() => mutation.mutate({ certificate, privateKey })}
      >
        {t("Загрузить сертификат")}
      </button>
      <p className="caption">
        {t(
          "Пара сертификат/ключ проверяется перед сохранением. Затем сохраните конфигурацию и перезапустите ядро.",
        )}
      </p>
    </div>
  );
}
