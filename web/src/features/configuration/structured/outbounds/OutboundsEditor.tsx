import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
import { useUiStore } from "@/app/state";
import { readField, updateField } from "@/features/configuration/structured/model";
import { JsonField } from "@/features/configuration/structured/fields";
import { OutboundRow } from "./OutboundRow";
import { editOutbounds, isOutboundList, type TOutboundAction } from "./model";
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
      <p className="config-note">
        {t("Исходящие подключения используются в ACL по имени. Порядок списка сохраняется.")}
      </p>
      {entries.map((entry, index) => (
        <OutboundRow key={index} value={entry} index={index} search={search} onEdit={onEdit} />
      ))}
      <button type="button" className="secondary" onClick={() => onEdit({ type: "add" })}>
        {t("Добавить исходящее подключение")}
      </button>
    </div>
  );
}
