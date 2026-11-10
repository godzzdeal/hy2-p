import { FormPassword } from "@/components/ui/forms";
import { type useCloudForm } from "@/hooks/admin/forms/use-cloud-form";
import { MIN_CLOUD_PASSWORD } from "@/services/session/cloud-password";

interface ICloudFields {
  form: ReturnType<typeof useCloudForm>["form"];
  confirmationRules: ReturnType<typeof useCloudForm>["confirmationRules"];
  isEnabled: boolean;
  isDisabling: boolean;
}
export function CloudFields({ form, confirmationRules, isEnabled, isDisabling }: ICloudFields) {
  return (
    <>
      <FormPassword
        control={form.control}
        name="currentPassword"
        label="Основной пароль"
        required
        canGenerate={false}
        minLength={0}
        autoComplete="current-password"
      />
      {isEnabled && (
        <FormPassword
          control={form.control}
          name="currentCloudPassword"
          label="Текущий облачный пароль"
          required
          canGenerate={false}
          minLength={0}
          autoComplete="off"
        />
      )}
      {!isDisabling && (
        <>
          <FormPassword
            control={form.control}
            name="password"
            label="Новый облачный пароль"
            required
            minLength={MIN_CLOUD_PASSWORD}
          />
          <FormPassword
            control={form.control}
            name="confirmation"
            rules={confirmationRules}
            label="Повторите облачный пароль"
            required
            canGenerate={false}
            minLength={MIN_CLOUD_PASSWORD}
          />
        </>
      )}
    </>
  );
}
