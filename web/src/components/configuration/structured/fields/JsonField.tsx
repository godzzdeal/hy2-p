import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
export function JsonField({
  id,
  value,
  onChange,
  multiline = false,
}: {
  id?: string;
  value: string;
  onChange: (value: unknown) => void;
  multiline?: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  function onInput(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setDraft(text);
    try {
      const parsed: unknown = multiline ? text : text === "" ? "" : JSON.parse(text);
      event.target.setCustomValidity("");
      onChange(parsed);
    } catch {
      event.target.setCustomValidity(t("Некорректный JSON"));
    }
  }
  return (
    <textarea id={id} className="structured-textarea" value={draft} spellCheck={false} onChange={onInput} />
  );
}
