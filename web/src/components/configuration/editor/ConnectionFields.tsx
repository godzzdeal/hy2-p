import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { DeploymentNotice } from "@/components/configuration/editor/DeploymentNotice";
import { CertificatePin } from "@/components/configuration/editor/connection";
import { useWebSettings } from "@/hooks/admin/use-admin";
import { setConnectionAddress } from "@/utils/configuration/address";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
interface IConnectionFields {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}
export function ConnectionFields({ value, onChange }: IConnectionFields) {
  const { t } = useTranslation();
  const [isSniLinked, setSniLinked] = useState(value.sni === value.host);
  const web = useWebSettings();
  const sharedAddress = web.data?.config.domain ?? "";
  const hasSuggested = useRef(!!value.host);
  useEffect(() => {
    if (!hasSuggested.current && !value.host && sharedAddress) {
      hasSuggested.current = true;
      onChange(setConnectionAddress(value, sharedAddress, isSniLinked));
    }
  }, [value, sharedAddress, isSniLinked, onChange]);
  useEffect(() => {
    if (isSniLinked && value.sni !== value.host) setSniLinked(false);
  }, [isSniLinked, value.sni, value.host]);
  return (
    <Card
      className="form-card"
      id="config-connection"
      data-scroll-section
      data-scroll-label={t("Параметры подключения")}
    >
      <CardHeader>
        <h2>{t("Параметры подключения")}</h2>
      </CardHeader>
      <FieldGrid>
        <Field>
          {t("Публичный адрес")}
          <Input
            aria-label={t("Публичный адрес")}
            placeholder="vpn.example.com"
            value={value.host}
            onChange={(event) => onChange(setConnectionAddress(value, event.target.value, isSniLinked))}
          />
          <small>{t("Адрес, к которому будет подключаться Happ. Например vpn.example.com.")}</small>
          {sharedAddress && value.host !== sharedAddress && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(setConnectionAddress(value, sharedAddress, isSniLinked))}
            >
              {t("Использовать адрес панели")}
            </Button>
          )}
        </Field>
        <Field>
          {t("Публичный UDP-порт")}
          <Input
            aria-label={t("Публичный UDP-порт")}
            required
            value={value.port}
            onChange={(event) => onChange({ ...value, port: event.target.value })}
          />
          <small>
            {t(
              "Порт, к которому подключается Happ. После изменения сохраните и нажмите «Применить UDP-порт».",
            )}
          </small>
        </Field>
        <div className="connection-sni">
          <Field>
            SNI
            <Input
              aria-label="SNI"
              disabled={isSniLinked}
              value={isSniLinked ? value.host : value.sni}
              onChange={(event) => onChange({ ...value, sni: event.target.value })}
            />
            <small>{t("Домен, на который выпущен сертификат. Обычно совпадает с публичным адресом.")}</small>
          </Field>
          <Field isInline>
            <Input
              type="checkbox"
              checked={isSniLinked}
              onChange={(event) => {
                setSniLinked(event.target.checked);
                if (event.target.checked) onChange({ ...value, sni: value.host });
              }}
            />
            {t("SNI совпадает с адресом")}
          </Field>
        </div>
        <CertificatePin value={value} onChange={onChange} />
      </FieldGrid>
      <DeploymentNotice />
    </Card>
  );
}
