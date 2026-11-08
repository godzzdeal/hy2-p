import { useSaveConfiguration } from "@/hooks/configuration/use-configuration";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useUiStore } from "@/store/ui-store";
import { orderConfiguration } from "@/utils/configuration/structured/yaml/ordering";
import { useEffect, useRef, useState } from "react";
export function useConfigurationDraft(initial: IConfiguration) {
  // Explicit local unsaved changes; server state remains in the query cache.
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const save = useSaveConfiguration();
  const [savedSequence, setSavedSequence] = useState(0);
  const sequenceRef = useRef(0);
  const setConfigurationDirty = useUiStore((state) => state.setConfigurationDirty);
  const showError = useUiStore((state) => state.showError);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    setConfigurationDirty(isDirty);
    return () => setConfigurationDirty(false);
  }, [isDirty, setConfigurationDirty]);
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
          sequenceRef.current++;
          setSavedSequence(sequenceRef.current);
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
    savedSequence,
    onApplied: (sequence: number) => {
      if (sequenceRef.current === sequence) setSavedSequence(0);
    },
    setDraft,
    isDirty,
    isPending: save.isPending,
    onOrder,
    onSave,
    onReset: () => setDraft(baseline),
  };
}
