import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { ArrowDownToLine, Download, Trash2 } from "@/components/elements/icons";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type TLogLevel } from "@/utils/core/logs/log-text";
import { useTranslation } from "react-i18next";
import { LogUserFilter, type ILogUserFilter } from "@/components/core/logs/filters";
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
  users,
  userId,
  onUser,
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
} & ILogUserFilter) {
  const { t } = useTranslation();
  return (
    <div className="log-toolbar flex flex-wrap items-center gap-2 border-b border-line p-3 max-phone:grid max-phone:grid-cols-2">
      <Input
        className="log-search max-phone:col-span-2"
        type="search"
        aria-label={t("Поиск в журнале")}
        placeholder={t("Найти в журнале")}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Select
        className="w-48 max-phone:w-full max-phone:col-span-2"
        aria-label={t("Уровень сообщений")}
        value={level}
        onValueChange={(value) => onLevel(value as TLogLevel)}
      >
        <SelectOption value="">{t("Все сообщения")}</SelectOption>
        <SelectOption value="error">{t("Ошибки")}</SelectOption>
        <SelectOption value="warn">{t("Предупреждения")}</SelectOption>
        <SelectOption value="info">{t("Информация")}</SelectOption>
      </Select>
      <LogUserFilter users={users} userId={userId} onUser={onUser} />
      <Button
        className="max-phone:col-span-2"
        type="button"
        variant="secondary"
        aria-pressed={isFollowing}
        onClick={onFollow}
      >
        <ArrowDownToLine width={24} height={24} aria-hidden />
        {t("Автопрокрутка")}
      </Button>
      <Button type="button" variant="outline" onClick={onDownload} disabled={!canClear}>
        <Download width={24} height={24} aria-hidden />
        {t("Скачать")}
      </Button>
      <Button type="button" variant="outline" onClick={onClear} disabled={!canClear}>
        <Trash2 width={24} height={24} aria-hidden />
        {t("Очистить")}
      </Button>
    </div>
  );
}
