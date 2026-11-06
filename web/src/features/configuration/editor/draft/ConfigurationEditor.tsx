import { lazy, Suspense, useState } from "react";
import { ConfigurationForm } from "@/features/configuration/structured";
import { type IConfiguration } from "@/features/configuration/model";
import { ConnectionFields } from "../ConnectionFields";
import { HistoryDialog } from "../HistoryDialog";
import { YamlLauncher, YamlLoading } from "../yaml";
import { DraftBar, SavedConfiguration } from "./status";
import { useConfigurationDraft } from "./use-configuration-draft";
const YamlDialog = lazy(() =>
  import("../yaml/YamlDialog").then((module) => ({ default: module.YamlDialog })),
);
export function ConfigurationEditor({ initial }: { initial: IConfiguration }) {
  const { draft, setDraft, isDirty, isPending, onOrder, onSave, onReset, savedSequence, onApplied } =
    useConfigurationDraft(initial);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isYamlOpen, setYamlOpen] = useState(false);
  function onRestore(value: IConfiguration) {
    setDraft(value);
    setHistoryOpen(false);
  }
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <ConnectionFields value={draft} onChange={setDraft} />
        <SavedConfiguration sequence={savedSequence} isDirty={isDirty} onApplied={onApplied} />
        <ConfigurationForm value={draft} onChange={setDraft} />
        <YamlLauncher onOpen={() => setYamlOpen(true)} onHistory={() => setHistoryOpen(true)} />
        <DraftBar isDirty={isDirty} isPending={isPending} onReset={onReset} />
      </form>
      {isHistoryOpen && <HistoryDialog onClose={() => setHistoryOpen(false)} onRestore={onRestore} />}
      {isYamlOpen && (
        <Suspense fallback={<YamlLoading onClose={() => setYamlOpen(false)} />}>
          <YamlDialog
            value={draft.config}
            onChange={(config) => setDraft((current) => ({ ...current, config }))}
            onOrder={onOrder}
            onSave={onSave}
            onClose={() => setYamlOpen(false)}
            isDirty={isDirty}
            isPending={isPending}
          />
        </Suspense>
      )}
    </>
  );
}
