import { useAccountChange } from "@/hooks/admin/use-admin";
import { type IAccountChange } from "@/services/admin/admin-types";
import { useForm, useWatch } from "react-hook-form";

export function useAccountForm(username: string) {
  const form = useForm<IAccountChange>({
    defaultValues: { username, currentPassword: "", password: "" },
    mode: "onChange",
  });
  const save = useAccountChange();
  const [nextUsername, currentPassword, password] = useWatch({
    control: form.control,
    name: ["username", "currentPassword", "password"],
  });
  const hasChanges = nextUsername.trim() !== username || (password !== "" && password !== currentPassword);
  const canSubmit = hasChanges && currentPassword !== "" && form.formState.isValid && !save.isPending;
  return {
    form,
    canSubmit,
    onSubmit: (value: IAccountChange) => {
      if (canSubmit) save.mutate({ ...value, username: value.username.trim() });
    },
  };
}
