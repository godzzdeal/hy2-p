import { useTranslation } from "react-i18next";
import { PairRow } from "./PairRow";
import { useUiStore } from "@/app/state";
export function PairEditor({
  value,
  onChange,
  hasGenerator,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  hasGenerator: boolean;
}) {
  const { t } = useTranslation();
  const entries =
    typeof value === "object" && value !== null && !Array.isArray(value) ? Object.entries(value) : [];
  const showError = useUiStore((state) => state.showError);
  function onCommit(previous: string, name: string, nextValue: string) {
    if (!name || (name !== previous && entries.some(([key]) => key === name))) {
      showError(new Error(t("Ключ или логин должен быть уникальным и непустым")));
      return;
    }
    onChange(
      Object.fromEntries(
        entries.map(([key, current]) => (key === previous ? [name, nextValue] : [key, current])),
      ),
    );
  }
  function onAdd() {
    let index = entries.length + 1;
    while (entries.some(([key]) => key === "user" + index)) index++;
    onChange(Object.fromEntries([...entries, ["user" + index, ""]]));
  }
  return (
    <div className="pair-editor">
      {entries.map(([name, current], index) => (
        <PairRow
          key={index}
          name={name}
          value={String(current)}
          hasGenerator={hasGenerator}
          onCommit={(key, next) => onCommit(name, key, next)}
          onRemove={() =>
            onChange(
              entries.length === 1 ? undefined : Object.fromEntries(entries.filter(([key]) => key !== name)),
            )
          }
        />
      ))}
      <button type="button" className="secondary" onClick={onAdd}>
        {t("Добавить параметр")}
      </button>
    </div>
  );
}
