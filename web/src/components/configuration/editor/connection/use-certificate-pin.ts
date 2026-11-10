import { useCertificates } from "@/hooks/configuration/use-certificates";
import { type IConfiguration } from "@/services/configuration/configuration-types";

export interface ICertificatePin {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}

export function useCertificatePin({ value, onChange }: ICertificatePin) {
  const isAutomatic = value.pinFromCertificate ?? false;
  const query = useCertificates(isAutomatic);
  return {
    isAutomatic,
    pin: isAutomatic ? (query.data?.pinSHA256 ?? "") : (value.pinSHA256 ?? ""),
    message: isAutomatic ? (query.data?.pinError ?? query.error?.message) : undefined,
    onToggle: (isChecked: boolean) => onChange({ ...value, pinFromCertificate: isChecked, pinSHA256: "" }),
    onChangePin: (pinSHA256: string) => onChange({ ...value, pinSHA256 }),
  };
}
