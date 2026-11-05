import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { generatePassword } from "./password";
export function PasswordField({
  value,
  onChange,
  label = "Пароль",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <label>
      {t(label)}
      <div className="password-input">
        <input
          type="password"
          autoComplete="new-password"
          value={value}
          required={required}
          minLength={12}
          maxLength={128}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className="secondary" onClick={() => onChange(generatePassword())}>
          <RefreshCw size={16} aria-hidden />
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
    </label>
  );
}
