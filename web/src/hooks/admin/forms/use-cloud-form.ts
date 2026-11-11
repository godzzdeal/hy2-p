import { useSaveCloudPassword } from "@/hooks/admin/use-cloud-password";
import { type ICloudPasswordChange } from "@/services/session/cloud-password";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface ICloudForm extends ICloudPasswordChange {
  confirmation: string;
  isDisabling: boolean;
}

export function useCloudForm() {
  const { t } = useTranslation();
  const form = useForm<ICloudForm>({
    defaultValues: {
      currentPassword: "",
      currentCloudPassword: "",
      password: "",
      confirmation: "",
      isDisabling: false,
    },
  });
  const isDisabling = useWatch({ control: form.control, name: "isDisabling" });
  const save = useSaveCloudPassword();
  function onSubmit(value: ICloudForm) {
    save.mutate({
      currentPassword: value.currentPassword,
      currentCloudPassword: value.currentCloudPassword,
      password: value.isDisabling ? "" : value.password,
    });
  }
  const confirmationRules = {
    validate: (value: string) => value === form.getValues("password") || t("Пароли не совпадают"),
  };
  return {
    form,
    isDisabling,
    isPending: save.isPending,
    confirmationRules,
    onSubmit,
  };
}
