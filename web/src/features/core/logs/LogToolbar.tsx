import { useTranslation } from "react-i18next";
import { Download, Trash2, ArrowDownToLine } from "@/shared/icons";
import { Select, SelectOption } from "@/shared/ui";
import { type TLogLevel } from "./model";
export function LogToolbar({
  search,
  onSearch,
  level,
  onLevel,
  isFollowing,
  onFollow,
  onDownload,
  onClear,
  canClear,
}: {
  search: string;
  onSearch: (value: string) => void;
  level: TLogLevel;
  onLevel: (value: TLogLevel) => void;
  isFollowing: boolean;
  onFollow: () => void;
  onDownload: () => void;
  onClear: () => void;
  canClear: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="log-toolbar flex flex-wrap items-center gap-2 border-b border-line p-3">
      <input
        className="log-search"
        type="search"
        aria-label={t("Поиск в журнале")}
        placeholder={t("Найти в журнале")}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Select
        aria-label={t("Уровень сообщений")}
        value={level}
        onValueChange={(value) => onLevel(value as TLogLevel)}
      >
        <SelectOption value="">{t("Все сообщения")}</SelectOption>
        <SelectOption value="error">{t("Ошибки")}</SelectOption>
        <SelectOption value="warn">{t("Предупреждения")}</SelectOption>
        <SelectOption value="info">{t("Информация")}</SelectOption>
      </Select>
      <button type="button" className="secondary" aria-pressed={isFollowing} onClick={onFollow}>
        <ArrowDownToLine width={24} height={24} aria-hidden />
        {t("Автопрокрутка")}
      </button>
      <button type="button" className="text-btn" onClick={onDownload} disabled={!canClear}>
        <Download width={24} height={24} aria-hidden />
        {t("Скачать")}
      </button>
      <button type="button" className="text-btn" onClick={onClear} disabled={!canClear}>
        <Trash2 width={24} height={24} aria-hidden />
        {t("Очистить")}
      </button>
    </div>
  );
}
