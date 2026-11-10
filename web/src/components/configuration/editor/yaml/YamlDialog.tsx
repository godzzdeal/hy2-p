import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { YamlCode } from "@/components/configuration/editor/yaml/code/YamlCode";
import { FileCode2 } from "@/components/elements/icons";
import { Modal } from "@/components/ui/overlays/Modal";
import { editorPhrases } from "@/utils/configuration/editor/yaml/language/phrases";
import { openSearchPanel } from "@codemirror/search";
import { type EditorView } from "@codemirror/view";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
interface IYamlDialog {
  value: string;
  onChange: (value: string) => void;
  onOrder: () => void;
  onSave: () => void;
  onClose: () => void;
  isDirty: boolean;
  isPending: boolean;
}
export function YamlDialog(props: IYamlDialog) {
  const { t } = useTranslation();
  const editor = useRef<EditorView | null>(null);
  const [errors, setErrors] = useState(0);
  return (
    <Modal
      title="Редактор YAML"
      className="yaml-dialog flex flex-col gap-4 overflow-hidden max-tablet:p-4 max-tablet:gap-3"
      onClose={props.onClose}
    >
      <div className="yaml-toolbar">
        <p>{t("Изменения остаются в черновике. Закрытие окна не сохраняет их на сервере.")}</p>
        <Actions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (editor.current) openSearchPanel(editor.current);
            }}
          >
            {t("Найти")}
          </Button>
          <Button type="button" variant="secondary" onClick={props.onOrder}>
            <FileCode2 width={24} height={24} aria-hidden />
            {t("Упорядочить")}
          </Button>
        </Actions>
      </div>
      <YamlCode
        value={props.value}
        onChange={props.onChange}
        onSave={props.onSave}
        onErrors={setErrors}
        onReady={(view) => {
          editor.current = view;
        }}
        label={t("Конфигурация Hysteria2 YAML")}
        phrases={editorPhrases(t)}
      />
      <div className="yaml-footer">
        <span role="status">{errors ? t("Ошибок YAML: {{count}}", { count: errors }) : t("Без ошибок")}</span>
        <Actions>
          <Button
            aria-label={t("Сохранить конфигурацию")}
            type="button"
            variant="primary"
            disabled={props.isPending || !props.isDirty || errors > 0}
            onClick={props.onSave}
          >
            {t(props.isPending ? "Сохраняем…" : "Сохранить")}
          </Button>
        </Actions>
      </div>
    </Modal>
  );
}
