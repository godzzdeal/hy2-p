import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { JsonField } from "@/components/configuration/structured/fields/JsonField";
import { OutboundRow } from "@/components/configuration/structured/outbounds/OutboundRow";
import { useUiStore } from "@/store/ui-store";
import {
  editOutbounds,
  isOutboundList,
  type TOutboundAction,
} from "@/utils/configuration/structured/outbounds/model";
import { readField, updateField } from "@/utils/configuration/structured/yaml/fields";
import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
export function OutboundsEditor({
  source,
  onChange,
  search,
}: {
  source: string;
  onChange: (source: string) => void;
  search: string;
}) {
  const { t } = useTranslation();
  const showError = useUiStore((state) => state.showError);
  const value = readField(parseDocument(source), "outbounds");
  function onEdit(action: TOutboundAction) {
    try {
      onChange(editOutbounds(source, action));
    } catch (error) {
      showError(error);
    }
  }
  if (value !== undefined && !isOutboundList(value))
    return (
      <JsonField
        value={JSON.stringify(value, null, 2)}
        onChange={(next) => onChange(updateField(source, "outbounds", next))}
      />
    );
  const entries = isOutboundList(value) ? value : [];
  return (
    <div className="outbounds-editor">
      <Notice>{t("Исходящие подключения используются в ACL по имени. Порядок списка сохраняется.")}</Notice>
      {entries.map((entry, index) => (
        <OutboundRow key={index} value={entry} index={index} search={search} onEdit={onEdit} />
      ))}
      <Button type="button" variant="secondary" onClick={() => onEdit({ type: "add" })}>
        {t("Добавить исходящее подключение")}
      </Button>
    </div>
  );
}
