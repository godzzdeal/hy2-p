import { PasswordField } from "@/components/elements/security/PasswordField";
import { MIN_CLOUD_PASSWORD, type ICloudPasswordChange } from "@/services/session/cloud-password";
import { useTranslation } from "react-i18next";

interface ICloudFields {
  value: ICloudPasswordChange;
  onChange: (value: ICloudPasswordChange) => void;
  confirmation: string;
  onConfirmation: (value: string) => void;
  isEnabled: boolean;
  isDisabling: boolean;
}
export function CloudFields({
  value,
  onChange,
  confirmation,
  onConfirmation,
  isEnabled,
  isDisabling,
}: ICloudFields) {
  const { t } = useTranslation();
  return (
    <>
      <label>
        {t("Основной пароль")}
        <input
          required
          type="password"
          autoComplete="current-password"
          value={value.currentPassword}
          onChange={(event) => onChange({ ...value, currentPassword: event.target.value })}
        />
      </label>
      {isEnabled && (
        <label>
          {t("Текущий облачный пароль")}
          <input
            required
            type="password"
            autoComplete="off"
            value={value.currentCloudPassword}
            onChange={(event) => onChange({ ...value, currentCloudPassword: event.target.value })}
          />
        </label>
      )}
      {!isDisabling && (
        <>
          <PasswordField
            label="Новый облачный пароль"
            required
            minLength={MIN_CLOUD_PASSWORD}
            value={value.password}
            onChange={(password) => onChange({ ...value, password })}
          />
          <label>
            {t("Повторите облачный пароль")}
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={MIN_CLOUD_PASSWORD}
              value={confirmation}
              onChange={(event) => onConfirmation(event.target.value)}
            />
          </label>
        </>
      )}
    </>
  );
}
