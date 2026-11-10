import { CoreOperationNotice } from "@/components/core/progress/CoreOperationNotice";
import { useControlProgress } from "@/hooks/core/control";
export function CoreProgress() {
  const operations = useControlProgress();
  return operations.map((operation) => <CoreOperationNotice key={operation.key} label={operation.label} />);
}
