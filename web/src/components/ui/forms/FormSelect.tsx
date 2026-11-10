import { Select } from "@/components/ui/select/Select";
import { type ComponentProps } from "react";
import { useController, type Control, type FieldPathByValue, type FieldValues } from "react-hook-form";

interface IFormSelect<T extends FieldValues> extends Omit<
  ComponentProps<typeof Select>,
  "name" | "value" | "onValueChange" | "ref" | "onBlur"
> {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  label: string;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  children,
  ...props
}: IFormSelect<T>) {
  const { field } = useController({ control, name });
  return (
    <Select
      {...props}
      ref={field.ref}
      name={field.name}
      onBlur={field.onBlur}
      aria-label={label}
      value={typeof field.value === "string" ? field.value : ""}
      onValueChange={field.onChange}
    >
      {children}
    </Select>
  );
}
