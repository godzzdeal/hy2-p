"use client";
import { usePageNavigation } from "@/hooks/layout/use-page-navigation";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/status/Badge";
import { HysteriaBadge } from "@/components/elements/hysteria";
import { Notice } from "@/components/ui/feedback";
import { Plus, RefreshCw } from "@/components/elements/icons";
import { CreateInstanceDialog } from "@/components/instances/dialogs/CreateInstanceDialog";
import { RenameInstanceDialog } from "@/components/instances/dialogs/RenameInstanceDialog";
import { InstanceCard } from "@/components/instances/list/card";
import { QueryState } from "@/components/ui/loading";
import { useInstances, useInstanceSelection } from "@/hooks/instances/use-instances";
import { MAX_INSTANCES, type IInstance } from "@/services/instances/types";
import { useInstanceStore } from "@/store/core/instance-store";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export default function InstancesPage() {
  const { t } = useTranslation();
  const query = useInstances();
  const [isCreating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<IInstance | null>(null);
  const { isPending } = useInstanceSelection();
  const { selectPage } = usePageNavigation();
  function onCreated(id: string) {
    setCreating(false);
    useInstanceStore.getState().setId(id);
    selectPage("config");
  }
  return (
    <>
      <div className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start">
        <div>
          <h1 className="flex flex-wrap items-center gap-3">
            {t("Экземпляры")} <HysteriaBadge />
            <Badge className="user-count h-8 min-w-8" count={query.data?.length ?? 0} variant="accent" />
          </h1>
          <p>{t("До 8 экземпляров на одном сервере.")}</p>
        </div>
        <div className="instance-actions flex flex-wrap gap-2">
          <Button
            aria-label={t("Обновить список")}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            {t("Обновить")}
          </Button>
          <Button
            aria-label={t("Добавить экземпляр")}
            variant="primary"
            disabled={isPending || !query.data || query.data.length >= MAX_INSTANCES}
            onClick={() => setCreating(true)}
          >
            <Plus width={24} height={24} aria-hidden />
            {t("Добавить")}
          </Button>
        </div>
      </div>
      <Notice>
        {t(
          "Пользователи и лимиты трафика общие для всех экземпляров. Доступ к экземплярам задаётся каждому пользователю.",
        )}
      </Notice>
      <QueryState isLoading={query.isPending} error={query.error} />
      <div className="instances-grid grid items-start gap-3 desktop:grid-cols-2">
        {query.data?.map((instance) => (
          <InstanceCard key={instance.id} instance={instance} onRename={setRenaming} />
        ))}
      </div>
      {isCreating && <CreateInstanceDialog onClose={() => setCreating(false)} onCreated={onCreated} />}
      {renaming && <RenameInstanceDialog instance={renaming} onClose={() => setRenaming(null)} />}
    </>
  );
}
