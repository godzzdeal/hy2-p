import { useTranslation } from "react-i18next";
import { Trash2 } from "@/shared/icons";
import { ConfigField } from "@/features/configuration/structured/controls";
import { OUTBOUND_FIELDS, outboundValue, type TOutboundAction } from "./model";
import { matchesProperty } from "@/features/configuration/structured/model";
export function OutboundRow({
  value,
  index,
  search,
  onEdit,
}: {
  value: Record<string, unknown>;
  index: number;
  search: string;
  onEdit: (action: TOutboundAction) => void;
}) {
  const { t } = useTranslation();
  const type = value.type ?? "direct";
  return (
    <div className="outbound-entry">
      <div className="outbound-heading">
        <h3>outbounds[{index}]</h3>
        <button type="button" className="secondary danger" onClick={() => onEdit({ type: "remove", index })}>
          <Trash2 width={24} height={24} aria-hidden />
          {t("Удалить подключение")}
        </button>
      </div>
      <div className="field-grid">
        {OUTBOUND_FIELDS.filter((field) => !field.when || type === field.when.value)
          .filter(
            (field) =>
              field.path === "name" ||
              field.path === "type" ||
              matchesProperty({ ...field, path: "outbounds[]." + field.path }, search),
          )
          .map((field) => (
            <ConfigField
              key={field.path}
              field={{ ...field, path: "outbounds[" + index + "]." + field.path }}
              value={outboundValue(value, field.path)}
              onChange={(next) => onEdit({ type: "set", index, path: field.path, value: next })}
            />
          ))}
      </div>
    </div>
  );
}
