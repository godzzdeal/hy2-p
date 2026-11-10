import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { RefreshCw, Trash2 } from "@/components/elements/icons";
import { generatePassword } from "@/utils/security/password";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    <div className="pair-row flex gap-2 items-center mb-2 flex-wrap max-tablet:gap-1">
      <Input
        aria-label={t("Ключ или логин")}
        value={draftName}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => onCommit(draftName, draftValue)}
      />
      <Input
        aria-label={t("Значение или пароль")}
        autoComplete="off"
        value={draftValue}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => onCommit(draftName, draftValue)}
      />
      {hasGenerator && (
        <Button type="button" size="icon" aria-label={t("Сгенерировать пароль")} onClick={onGenerate}>
          <RefreshCw width={24} height={24} aria-hidden />
        </Button>
      )}
      <Button
        type="button"
        variant="danger"
        size="icon"
        aria-label={t("Удалить параметр")}
        onClick={onRemove}
      >
        <Trash2 width={24} height={24} aria-hidden />
      </Button>
    </div>
  );
}
