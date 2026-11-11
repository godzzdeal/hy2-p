import { PasswordField } from "@/components/elements/security/PasswordField";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/utils/security";
import { type ComponentProps } from "react";
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

type TFormPassword<T extends FieldValues> = Omit<
  ComponentProps<typeof PasswordField>,
  "value" | "onChange" | "ref" | "onBlur"
> & {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  rules?: UseControllerProps<T, FieldPathByValue<T, string>>["rules"];
};

export function FormPassword<T extends FieldValues>({
  control,
  name,
  rules,
  required,
  label = "Пароль",
  minLength = PASSWORD_MIN_LENGTH,
  maxLength = PASSWORD_MAX_LENGTH,
  ...props
}: TFormPassword<T>) {
  const { t } = useTranslation();
  const { field } = useController({
    control,
    name,
    rules: {
      required: required ? t("Заполните поле «{{field}}».", { field: t(label) }) : false,
      minLength: {
        value: minLength,
        message: t("Поле «{{field}}»: не менее {{count}} символов.", { field: t(label), count: minLength }),
      },
      maxLength: {
        value: maxLength,
        message: t("Поле «{{field}}»: не более {{count}} символов.", { field: t(label), count: maxLength }),
      },
      ...rules,
    },
  });
  return (
    <PasswordField
      {...props}
      label={label}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      value={typeof field.value === "string" ? field.value : ""}
      onChange={field.onChange}
    />
  );
}
