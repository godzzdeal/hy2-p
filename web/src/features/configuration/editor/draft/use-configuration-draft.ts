import { useEffect, useState } from "react";
import { useUiStore } from "@/app/state";
import { useSaveConfiguration, type IConfiguration } from "@/features/configuration/model";
import { orderConfiguration } from "@/features/configuration/structured/model";
export function useConfigurationDraft(initial: IConfiguration) {
  // Explicit local unsaved changes; server state remains in the query cache.
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const save = useSaveConfiguration();
  const showError = useUiStore((state) => state.showError);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    if (!isDirty) return;
    const onLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [isDirty]);
  function onOrder() {
    try {
      setDraft({ ...draft, config: orderConfiguration(draft.config) });
    } catch (error) {
      showError(error);
    }
  }
  function onSave() {
    try {
      const ordered = { ...draft, config: orderConfiguration(draft.config) };
      setDraft(ordered);
      save.mutate(ordered, {
        onSuccess: (saved) => {
          setBaseline(saved);
          setDraft((current) => (current === ordered ? saved : current));
        },
      });
    } catch (error) {
      showError(error);
    }
  }
  return {
    draft,
    setDraft,
    isDirty,
    isPending: save.isPending,
    onOrder,
    onSave,
    onReset: () => setDraft(baseline),
  };
}
