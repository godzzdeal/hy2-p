import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  highlightSpecialChars,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { yaml } from "@codemirror/lang-yaml";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { linter } from "@codemirror/lint";
import { YAML_HIGHLIGHT, yamlDiagnostics } from "../language";
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
