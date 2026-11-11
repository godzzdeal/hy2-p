import { useUiStore } from "@/store/ui-store";
import { copyValue } from "@/utils/clipboard";
import { useState } from "react";

export function useCopy(value: string, fallback: string) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const notify = useUiStore((state) => state.notify);
  async function onCopy() {
    setPending(true);
    try {
      await copyValue(value);
      setCopiedValue(value);
      notify("Скопировано");
    } catch {
      setCopiedValue(null);
      notify(fallback);
    } finally {
      setPending(false);
    }
  }
  return {
    isCopied: copiedValue === value,
    isPending,
    onCopy: () => void onCopy(),
  };
}
