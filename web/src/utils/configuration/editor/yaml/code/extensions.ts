import { YAML_HIGHLIGHT } from "@/utils/configuration/editor/yaml/language/highlight";
import { yamlDiagnostics } from "@/utils/configuration/editor/yaml/language/lint";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { yaml } from "@codemirror/lang-yaml";
import { indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
export interface IEditorActions {
  onChange: (value: string) => void;
  onErrors: (count: number) => void;
  onSave: () => void;
  label: string;
  phrases: Record<string, string>;
}
export function yamlExtensions(actions: IEditorActions): Extension[] {
  return [
    yaml(),
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    highlightSpecialChars(),
    highlightSelectionMatches(),
    indentOnInput(),
    indentUnit.of("  "),
    EditorState.tabSize.of(2),
    EditorView.lineWrapping,
    syntaxHighlighting(YAML_HIGHLIGHT),
    EditorState.phrases.of(actions.phrases),
    EditorView.contentAttributes.of({ "aria-label": actions.label, spellcheck: "false" }),
    keymap.of([
      {
        key: "Mod-s",
        preventDefault: true,
        run: () => {
          actions.onSave();
          return true;
        },
      },
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) actions.onChange(update.state.doc.toString());
    }),
    linter((view) => {
      const errors = yamlDiagnostics(view.state.doc.toString());
      actions.onErrors(errors.length);
      return errors;
    }),
  ];
}
