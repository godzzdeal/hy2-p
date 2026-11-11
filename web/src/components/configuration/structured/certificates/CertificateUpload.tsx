import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
import { useCertificateUpload } from "@/hooks/configuration/use-certificates";
import { readPemFile } from "@/utils/security";
import { useState } from "react";
import { FileDropzone } from "@/components/elements/upload";
import { useTranslation } from "react-i18next";
export function CertificateUpload({ onUploaded }: { onUploaded: (cert: string, key: string) => void }) {
  const { t } = useTranslation();
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const mutation = useCertificateUpload((certificatePath, keyPath) => {
    onUploaded(certificatePath, keyPath);
    setPrivateKey("");
  });
  async function onFile(file: File, target: "cert" | "key") {
    const text = await readPemFile(file);
    if (target === "cert") setCertificate(text);
    else setPrivateKey(text);
  }
  return (
    <div className="certificate-upload grid gap-3 min-w-0">
      <FileDropzone
        label={t("Сертификат PEM")}
        hint={t("PEM, CRT или CER, до 1 МБ")}
        accept=".crt,.pem,.cer"
        disabled={mutation.isPending}
        onFile={(file) => onFile(file, "cert")}
      />
      <FileDropzone
        label={t("Приватный ключ PEM")}
        hint={t("PEM или KEY, до 1 МБ")}
        accept=".key,.pem"
        disabled={mutation.isPending}
        onFile={(file) => onFile(file, "key")}
      />
      <Button
        aria-label={t("Загрузить сертификат")}
        type="button"
        variant="secondary"
        disabled={!certificate || !privateKey || mutation.isPending}
        onClick={() => mutation.mutate({ certificate, privateKey })}
      >
        {t("Загрузить")}
      </Button>
      <Caption>
        {t(
          "Пара сертификат/ключ проверяется перед сохранением. Затем сохраните конфигурацию и перезапустите экземпляр.",
        )}
      </Caption>
    </div>
  );
}
