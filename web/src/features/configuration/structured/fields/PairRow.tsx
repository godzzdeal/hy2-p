import { useTranslation } from "react-i18next";
import { useState } from "react";
import { RefreshCw, Trash2 } from "@/shared/icons";
import { generatePassword } from "@/shared/security";
interface IPairRow {
  name: string;
  value: string;
  onCommit: (name: string, value: string) => void;
  onRemove: () => void;
  hasGenerator: boolean;
}
export function PairRow({ name, value, onCommit, onRemove, hasGenerator }: IPairRow) {
  const { t } = useTranslation();
  const [draftName, setName] = useState(name);
  const [draftValue, setValue] = useState(value);
  function onGenerate() {
    const generated = generatePassword();
    setValue(generated);
    onCommit(draftName, generated);
  }
  return (
    <div className="pair-row">
      <input
        aria-label={t("Ключ или логин")}
        value={draftName}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => onCommit(draftName, draftValue)}
      />
      <input
        aria-label={t("Значение или пароль")}
        autoComplete="off"
        value={draftValue}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onCommit(draftName, draftValue)}
      />
      {hasGenerator && (
        <button
          type="button"
          className="icon-btn"
          aria-label={t("Сгенерировать пароль")}
          onClick={onGenerate}
        >
          <RefreshCw width={24} height={24} aria-hidden />
        </button>
      )}
      <button type="button" className="icon-btn danger" aria-label={t("Удалить параметр")} onClick={onRemove}>
        <Trash2 width={24} height={24} aria-hidden />
      </button>
    </div>
  );
}
