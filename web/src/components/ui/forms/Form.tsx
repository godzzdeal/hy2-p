import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { type ComponentProps } from "react";
import { type FieldErrors, type FieldValues, type SubmitHandler, type UseFormReturn } from "react-hook-form";

interface IForm<T extends FieldValues> extends Omit<ComponentProps<"form">, "onSubmit" | "noValidate"> {
  form: Pick<UseFormReturn<T>, "handleSubmit">;
  onSubmit: SubmitHandler<T>;
}

export function Form<T extends FieldValues>({ form, onSubmit, children, className, ...props }: IForm<T>) {
  const showError = useUiStore((state) => state.showError);
  function onInvalid(errors: FieldErrors<T>) {
    const first = Object.values(errors).find((error) => error?.message);
    showError(typeof first?.message === "string" ? first.message : "Проверьте заполнение полей");
  }
  const onValid: SubmitHandler<T> = async (value, event) => {
    try {
      await onSubmit(value, event);
    } catch (error) {
      showError(error);
    }
  };
  return (
    <form
      {...props}
      className={cn("grid min-w-0 gap-3", className)}
      noValidate
      onSubmit={form.handleSubmit(onValid, onInvalid)}
    >
      {children}
    </form>
  );
}
