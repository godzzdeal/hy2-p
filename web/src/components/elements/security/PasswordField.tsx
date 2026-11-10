import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
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
    <div className="password-field min-w-0">
      {hasLabel && (
        <Field htmlFor={id} className="mb-2">
          {t(label)}
        </Field>
      )}
      <div className="password-input mt-0 flex gap-2 items-center max-tablet:flex-wrap">
        <Input
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
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t(isVisible ? "Скрыть пароль" : "Показать пароль")}
          aria-pressed={isVisible}
          disabled={disabled}
          onClick={() => setVisible(!isVisible)}
        >
          <Icon width={24} height={24} aria-hidden />
        </Button>
        {canGenerate && (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || props.readOnly}
            onClick={() => onChange(generatePassword())}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            {t("Сгенерировать")}
          </Button>
        )}
      </div>
    </div>
  );
}
