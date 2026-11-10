import { useAccountChange } from "@/hooks/admin/use-admin";
import { type IAccountChange } from "@/services/admin/admin-types";
import { useForm } from "react-hook-form";

export function useAccountForm(username: string) {
  const form = useForm<IAccountChange>({ defaultValues: { username, currentPassword: "", password: "" } });
  const save = useAccountChange();
  return { form, isPending: save.isPending, onSubmit: (value: IAccountChange) => save.mutate(value) };
}
