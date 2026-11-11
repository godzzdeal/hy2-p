import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { Button } from "@/components/ui/button/Button";
import { ConfigField } from "@/components/configuration/structured/controls/ConfigField";
import { Trash2 } from "@/components/elements/icons";
import {
  OUTBOUND_FIELDS,
  outboundValue,
  type TOutboundAction,
} from "@/utils/configuration/structured/outbounds/model";
import { matchesProperty } from "@/utils/configuration/structured/search";
import { useTranslation } from "react-i18next";
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
    <div className="outbound-entry border-b border-line">
      <div className="outbound-heading flex justify-between items-center gap-3 p-4 bg-surface-soft flex-wrap">
        <h3>outbounds[{index}]</h3>
        <Button
          aria-label={t("Удалить подключение")}
          type="button"
          variant="secondary"
          onClick={() => onEdit({ type: "remove", index })}
        >
          <Trash2 width={24} height={24} aria-hidden />
          {t("Удалить")}
        </Button>
      </div>
      <FieldGrid columns={2}>
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
              field={{
                ...field,
                path: "outbounds[" + index + "]." + field.path,
              }}
              value={outboundValue(value, field.path)}
              onChange={(next) => onEdit({ type: "set", index, path: field.path, value: next })}
            />
          ))}
      </FieldGrid>
    </div>
  );
}
