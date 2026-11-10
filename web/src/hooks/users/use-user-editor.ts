import { useUserCommands } from "@/hooks/users/user-queries";
import { type IUser } from "@/services/users/user-types";
import { useForm } from "react-hook-form";

interface IUserEditorValues {
  name: string;
  password: string;
  expires: string;
  isEnabled: boolean;
}

export function useUserEditor(user: IUser | undefined, onClose: () => void) {
  const form = useForm<IUserEditorValues>({
    defaultValues: {
      name: user?.name ?? "",
      password: "",
      expires: user?.expires.slice(0, 10) ?? "",
      isEnabled: user?.enabled ?? true,
    },
  });
  const { create, update } = useUserCommands();
  function onSubmit(value: IUserEditorValues) {
    const body = {
      name: value.name,
      password: value.password,
      expires: value.expires ? new Date(value.expires + "T23:59:59").toISOString() : "",
    };
    if (user)
      update.mutate({ id: user.id, body: { ...body, enabled: value.isEnabled } }, { onSuccess: onClose });
    else create.mutate(body, { onSuccess: onClose });
  }
  return { form, isPending: create.isPending || update.isPending, onSubmit };
}
