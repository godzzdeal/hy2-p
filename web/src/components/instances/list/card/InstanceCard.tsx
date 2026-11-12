import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Badge } from "@/components/ui/status/Badge";
import { Notice } from "@/components/ui/feedback";
import { useInstanceCard } from "@/hooks/instances/use-instance-card";
import type { IInstance } from "@/services/instances/types";
import { cn } from "@/utils/cn";
import { InstanceDetails } from "./InstanceDetails";
import { InstanceActions } from "./InstanceActions";
import { useTranslation } from "react-i18next";

export function InstanceCard({
  instance,
  onRename,
}: {
  instance: IInstance;
  onRename: (instance: IInstance) => void;
}) {
  const { t } = useTranslation();
  const controls = useInstanceCard(instance);
  return (
    <Card
      className={cn("instance-card mb-0", controls.isSelected && "is-selected border-accent")}
      aria-label={instance.name}
    >
      <CardHeader className="gap-2 px-3 py-2 max-tablet:p-3">
        <h2 className="min-w-0 flex-1">{instance.name}</h2>
        <Badge variant={instance.running ? "success" : "neutral"} className="shrink-0">
          {t(controls.status)}
        </Badge>
      </CardHeader>
      {instance.error && (
        <Notice variant="danger" className="mx-3 mt-3 mb-0">
          {t(instance.error)}
        </Notice>
      )}
      <InstanceDetails instance={instance} />
      <InstanceActions controls={controls} onRename={() => onRename(instance)} />
    </Card>
  );
}
