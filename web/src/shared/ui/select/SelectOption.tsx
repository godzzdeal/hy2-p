import * as Primitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
import { type ReactNode } from "react";
import { encodeSelectValue } from "./select-value";
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
        <Check size={16} aria-hidden />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}
