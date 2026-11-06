import { useTranslation } from "react-i18next";
import { useId } from "react";
import { RefreshCw } from "@/shared/icons";
import { generatePassword } from "./password";
export function PasswordField({
  inputId,
  hasLabel = true,
  value,
  onChange,
  label = "Пароль",
  required = false,
  minLength = 12,
}: {
  inputId?: string;
  hasLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minLength?: number;
}) {
  const { t } = useTranslation();
  const generatedId = useId();
  const id = inputId ?? generatedId;
  return (
    <div className="password-field">
      {hasLabel && <label htmlFor={id}>{t(label)}</label>}
      <div className="password-input">
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          value={value}
          required={required}
          minLength={minLength}
          maxLength={128}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className="secondary" onClick={() => onChange(generatePassword())}>
          <RefreshCw width={24} height={24} aria-hidden />
          {t("Сгенерировать")}
        </button>
      </div>
      <input
        className="generated-password"
        aria-label={t("Значение пароля для копирования")}
        readOnly
        value={value}
        placeholder={t("Оставьте пустым, чтобы не менять")}
      />
    </div>
  );
}
