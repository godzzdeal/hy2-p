import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/fields/controls/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { Notice } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/status/Badge";
import { ConfigProperty } from "@/components/configuration/structured/ConfigProperty";
import { useAclEditor, type IAclEditor } from "@/hooks/configuration/acl";
import { AclRuleList } from "./rules";
import { AclFileNotice } from "./AclFileNotice";
import { AclRuleDialog } from "./form";
import { useTranslation } from "react-i18next";

export function AclEditor(props: IAclEditor) {
  const { t } = useTranslation();
  const editor = useAclEditor(props);
  if (editor.hasInvalidValue)
    return (
      <Notice variant="danger">{t("acl.inline должен содержать список строк. Исправьте его в YAML.")}</Notice>
    );
  return (
    <section className="grid min-w-0 gap-4" aria-label={t("Редактор правил ACL")}>
      {editor.hasFile && <AclFileNotice onInline={editor.onInline} />}
      <ConfigProperty
        path="acl.inline"
        canReset={editor.hasInline}
        onReset={() => props.onSet("acl.inline", undefined)}
      >
        <Badge>{editor.lines.length}</Badge>
      </ConfigProperty>
      <div className="flex min-w-0 items-center justify-between flex-wrap gap-3">
        {editor.lines.length > 0 ? (
          <Input
            className="min-w-0 flex-1"
            type="search"
            aria-label={t("Найти правило ACL")}
            placeholder={t("Поиск правил")}
            value={editor.search}
            onChange={(event) => editor.onSearch(event.target.value)}
          />
        ) : (
          <p className="m-0 text-muted">{t("Правил пока нет")}</p>
        )}
        <Button type="button" variant="primary" disabled={editor.hasFile} onClick={editor.onAdd}>
          {t("Добавить")}
        </Button>
      </div>
      {editor.lines.length > 0 && editor.rows.length === 0 && (
        <EmptyState>{t("Ничего не найдено")}</EmptyState>
      )}
      <AclRuleList
        rows={editor.rows}
        total={editor.lines.length}
        isDisabled={editor.hasFile}
        onEdit={editor.setSelected}
        onRemove={editor.onRemove}
        onMove={editor.onMove}
      />
      <Pagination
        className="p-0"
        page={editor.pagination.current}
        pageCount={editor.pagination.pageCount}
        onChange={editor.pagination.setPage}
      />
      {editor.selected !== null && (
        <AclRuleDialog
          source={editor.selected < 0 ? undefined : editor.lines[editor.selected]}
          outbounds={editor.outboundNames}
          onSave={editor.onSave}
          onClose={() => editor.setSelected(null)}
        />
      )}
    </section>
  );
}
