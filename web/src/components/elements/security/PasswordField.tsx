import { RefreshCw } from "@/components/elements/icons";
import { Eye } from "pixelarticons/react/Eye.js";
import { EyeOff } from "pixelarticons/react/EyeOff.js";
import { generatePassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/utils/security";
import { useId, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
interface IPasswordField extends Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "children"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hasLabel?: boolean;
  canGenerate?: boolean;
}

export function PasswordField({
  id: inputId,
  hasLabel = true,
  value,
  onChange,
  label = "Пароль",
  required = false,
  minLength = PASSWORD_MIN_LENGTH,
  canGenerate = true,
  autoComplete = "new-password",
  autoFocus = false,
  placeholder,
  maxLength = PASSWORD_MAX_LENGTH,
  disabled,
  ...props
}: IPasswordField) {
  const { t } = useTranslation();
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const [isVisible, setVisible] = useState(false);
  const Icon = isVisible ? Eye : EyeOff;
  return (
    <div className="password-field">
      {hasLabel && <label htmlFor={id}>{t(label)}</label>}
      <div className="password-input">
        <input
          {...props}
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder ? t(placeholder) : undefined}
          value={value}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="icon-btn secondary"
          aria-label={t(isVisible ? "Скрыть пароль" : "Показать пароль")}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={() => setVisible(!isVisible)}
        >
          <Icon width={24} height={24} aria-hidden />
        </button>
        {canGenerate && (
          <button
            type="button"
            className="secondary"
            disabled={disabled || props.readOnly}
            onClick={() => onChange(generatePassword())}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            {t("Сгенерировать")}
          </button>
        )}
      </div>
    </div>
  );
}
