import { Field } from "@/components/ui/fields/Field";
import { FieldInfo } from "./FieldInfo";
import { cn } from "@/utils/cn";
import type { ComponentProps, ReactNode } from "react";

interface IInfoField extends ComponentProps<"div"> {
  label: string;
  description: ReactNode;
  htmlFor: string;
}

export function InfoField({ label, description, htmlFor, children, className, ...props }: IInfoField) {
  return (
    <div {...props} className={cn("grid min-w-0 grid-rows-subgrid row-span-2 gap-2", className)}>
      <div className="flex min-h-control min-w-0 items-center justify-between gap-2">
        <Field htmlFor={htmlFor} className="min-w-0 self-center wrap-anywhere">
          {label}
        </Field>
        <FieldInfo label={label}>{description}</FieldInfo>
      </div>
      <div className="grid min-w-0 content-start gap-2">{children}</div>
    </div>
  );
}
