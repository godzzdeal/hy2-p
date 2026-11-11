import { Field } from "@/components/ui/fields/Field";
import { InfoField } from "@/components/ui/fields/information";
import { useId } from "react";
import { Input } from "@/components/ui/fields/controls/Input";
import {
  useCertificatePin,
  type ICertificatePin,
} from "@/components/configuration/editor/connection/use-certificate-pin";
import { useTranslation } from "react-i18next";

export function CertificatePin(props: ICertificatePin) {
  const { t } = useTranslation();
  const id = useId();
  const { isAutomatic, pin, message, onToggle, onChangePin } = useCertificatePin(props);
  return (
    <InfoField
      htmlFor={id}
      label="pinSHA256"
      description={t("После замены сертификата обновите подписку на устройствах.")}
    >
      <Input
        id={id}
        aria-label="pinSHA256"
        value={pin}
        readOnly={isAutomatic}
        placeholder={isAutomatic ? t("После получения сертификата") : "SHA-256"}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChangePin(event.target.value)}
      />
      {message && (
        <p className="text-lg text-danger" role="status">
          {t(message)}
        </p>
      )}
      <Field isInline>
        <Input type="checkbox" checked={isAutomatic} onChange={(event) => onToggle(event.target.checked)} />
        {t("Вычислять по сертификату")}
      </Field>
    </InfoField>
  );
}
