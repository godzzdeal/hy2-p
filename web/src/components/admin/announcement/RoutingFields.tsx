import { type IClientRouting, CLIENT_ROUTING_LIMIT } from "@/services/admin/announcement";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Textarea } from "@/components/ui/fields/controls/Textarea";
import { Notice } from "@/components/ui/feedback";
import { useTranslation } from "react-i18next";
interface IRoutingFields {
  value: IClientRouting;
  onChange: (value: IClientRouting) => void;
}
export function RoutingFields({ value, onChange }: IRoutingFields) {
  const { t } = useTranslation();
  return (
    <fieldset className="grid min-w-0 gap-4 border-2 border-line p-4">
      <legend className="px-2">{t("Маршрутизация клиентов")}</legend>
      <Notice>
        {t(
          "Правила передаются в подписке для Happ. Другие приложения могут их игнорировать. Обновите подписку и переподключитесь.",
        )}
      </Notice>
      <Field isInline>
        <Input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
        />
        {t("Выбранные сайты напрямую, остальные через VPN")}
      </Field>
      <Field>
        {t("Сайты для прямого доступа")}
        <Textarea
          value={value.domains.join("\n")}
          rows={4}
          disabled={!value.enabled}
          placeholder="example.com"
          onChange={(event) => onChange({ ...value, domains: event.target.value.split("\n") })}
        />
      </Field>
      <p className="muted">
        {t(
          "По одному домену в строке, без https:// и пути. Поддомены включены. Не более {{count}} доменов.",
          { count: CLIENT_ROUTING_LIMIT },
        )}
      </p>
    </fieldset>
  );
}
