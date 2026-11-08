import { Check } from "@/components/elements/icons";
import { encodeSelectValue } from "@/components/ui/select/select-value";
import * as Primitive from "@radix-ui/react-select";
import { type ReactNode } from "react";
export function SelectOption({
  value,
  children,
  disabled,
}: {
  value: string | number;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Primitive.Item className="select-option" value={encodeSelectValue(value)} disabled={disabled}>
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator className="select-check">
        <Check width={24} height={24} aria-hidden />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
