import { PemFileField } from "@/components/elements/security/PemFileField";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IWebConfig } from "@/services/admin/admin-types";
import { useTranslation } from "react-i18next";
export function CertificateFields({
  value,
  onChange,
  hasPrivateKey,
}: {
  value: IWebConfig;
  onChange: (value: IWebConfig) => void;
  hasPrivateKey: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="form-body">
      <label>
        {t("HTTPS веб-панели")}
        <Select
          value={value.mode}
          onValueChange={(nextValue) => onChange({ ...value, mode: nextValue as IWebConfig["mode"] })}
        >
          <SelectOption value="http">{t("HTTP без сертификата")}</SelectOption>
          <SelectOption value="manual">{t("HTTPS со своим сертификатом")}</SelectOption>
          <SelectOption value="acme">{t("HTTPS с автоматическим сертификатом")}</SelectOption>
        </Select>
      </label>
      {value.mode !== "http" && (
        <label>
          {t("Домен или IP веб-панели")}
          <input
            required
            placeholder="panel.example.com / 203.0.113.10"
            value={value.domain}
            onChange={(event) => onChange({ ...value, domain: event.target.value })}
          />
        </label>
      )}
      {value.mode === "http" && (
        <p className="caption">
          {t(
            "Домен и сертификат не нужны. Для входа по IP укажите публичный URL с http://. Соединение HTTP не зашифровано.",
          )}
        </p>
      )}
      {value.mode === "manual" && (
        <>
          <PemFileField
            label={t("Сертификат веб-панели PEM")}
            onChange={(certificate) => onChange({ ...value, certificate })}
          />
          <PemFileField
            label={t("Приватный ключ веб-панели PEM")}
            onChange={(privateKey) => onChange({ ...value, privateKey })}
          />
          {hasPrivateKey && (
            <p className="caption">
              {t("Сохранённый ключ не показывается. Если ключ не меняется, повторно загружать его не нужно.")}
            </p>
          )}
        </>
      )}
      {value.mode === "acme" && (
        <>
          <label>
            {t("Email для Let's Encrypt")}
            <input
              type="email"
              required
              value={value.email}
              onChange={(event) => onChange({ ...value, email: event.target.value })}
            />
          </label>
          <label>
            {t("Внутренний HTTP-порт ACME")}
            <input
              type="number"
              required
              min={1}
              max={65535}
              value={value.challengePort}
              onChange={(event) => onChange({ ...value, challengePort: Number(event.target.value) })}
            />
            <small>
              {t(
                "Входящий TCP 80 должен вести на этот порт. Для домена проверьте DNS, для IP укажите публичный адрес сервера.",
              )}
            </small>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              required
              checked={value.acceptedTerms}
              onChange={(event) => onChange({ ...value, acceptedTerms: event.target.checked })}
            />
            {t("Принимаю условия Let's Encrypt")}
          </label>
          <a href="https://letsencrypt.org/repository/" target="_blank" rel="noreferrer">
            {t("Условия центра сертификации")}
          </a>
          <p className="caption">
            {t(
              "Сертификат выпускается и продлевается автоматически. Кеш ACME сохраняется на постоянном томе.",
            )}
          </p>
          <p className="caption">
            {t(
              "Для публичного IP используется сертификат Let's Encrypt на 160 часов. Панель автоматически продлевает его; TCP 80 должен оставаться доступным.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
