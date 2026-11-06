import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { yamlExtensions, type IEditorActions } from "./extensions";
export interface IYamlCode extends IEditorActions {
  value: string;
  onReady: (view: EditorView | null) => void;
}
export function useYamlEditor(options: IYamlCode) {
  const parent = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  useEffect(() => {
    if (!parent.current) return;
    const view = new EditorView({
      parent: parent.current,
      state: EditorState.create({
        doc: latest.current.value,
        extensions: yamlExtensions({
          label: latest.current.label,
          phrases: latest.current.phrases,
          onChange: (value) => latest.current.onChange(value),
          onErrors: (count) => latest.current.onErrors(count),
          onSave: () => latest.current.onSave(),
        }),
      }),
    });
    editor.current = view;
    latest.current.onReady(view);
    const focusFrame = requestAnimationFrame(() => view.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      latest.current.onReady(null);
      editor.current = null;
      view.destroy();
    };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (!view || view.state.doc.toString() === options.value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: options.value },
      selection: { anchor: Math.min(view.state.selection.main.head, options.value.length) },
    });
  }, [options.value]);
  return parent;
}
