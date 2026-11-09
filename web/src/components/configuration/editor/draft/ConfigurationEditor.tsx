import { ConnectionFields } from "@/components/configuration/editor/ConnectionFields";
import { ConfigurationFile } from "@/components/configuration/editor/files";
import { DraftBar } from "@/components/configuration/editor/draft/status/DraftBar";
import { SavedConfiguration } from "@/components/configuration/editor/draft/status/SavedConfiguration";
import { HistoryDialog } from "@/components/configuration/editor/HistoryDialog";
import { YamlLauncher } from "@/components/configuration/editor/yaml/YamlLauncher";
import { YamlLoading } from "@/components/configuration/editor/yaml/YamlLoading";
import { ConfigurationForm } from "@/components/configuration/structured/form/ConfigurationForm";
import { useConfigurationDraft } from "@/hooks/configuration/editor/draft/use-configuration-draft";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { lazy, Suspense, useState } from "react";
const YamlDialog = lazy(() =>
  import("@/components/configuration/editor/yaml/YamlDialog").then((module) => ({
    default: module.YamlDialog,
  })),
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
        <ConfigurationFile value={draft} onChange={setDraft} />
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
