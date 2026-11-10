import { LogLine } from "@/components/core/logs/lines";
import { LogToolbar } from "@/components/core/logs/LogToolbar";
import { RefreshCw } from "@/components/elements/icons";
import { QueryState } from "@/components/ui/loading";
import { useLogEntries } from "@/hooks/core/logs";
import { cn } from "@/utils/cn";
import { downloadLogs, LOG_VIEW } from "@/utils/core/logs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
export function CoreLog() {
  const { t } = useTranslation();
  const { query, users, clear, search, setSearch, level, setLevel, userId, setUserId, text, visible, total } =
    useLogEntries();
  const [isExpanded, setExpanded] = useState(false);
  const [isFollowing, setFollowing] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFollowing && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [text, search, level, userId, isFollowing]);
  function onScroll() {
    const element = viewport.current;
    if (element)
      setFollowing(
        element.scrollHeight - element.scrollTop - element.clientHeight < LOG_VIEW.bottomThreshold,
      );
  }
  return (
    <section
      className="card log-card"
      id="core-logs"
      data-scroll-section
      data-scroll-label={t("Журнал экземпляра")}
    >
      <div className="card-header">
        <h2>{t("Журнал экземпляра")}</h2>
        <div className="row-actions">
          <button
            type="button"
            className="text-btn"
            onClick={() => setExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? t("Свернуть") : t("Развернуть")}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={t("Обновить журнал")}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw width={24} height={24} aria-hidden />
          </button>
        </div>
      </div>
      <LogToolbar
        users={users.data ?? []}
        userId={userId}
        onUser={setUserId}
        search={search}
        onSearch={setSearch}
        level={level}
        onLevel={setLevel}
        isFollowing={isFollowing}
        onFollow={() => setFollowing(!isFollowing)}
        onDownload={() => downloadLogs(text)}
        onClear={() => clear.mutate()}
        canClear={!!text && !clear.isPending}
      />
      <QueryState isLoading={query.isPending} error={query.error} />
      <div
        ref={viewport}
        role="region"
        tabIndex={0}
        aria-label={t("Сообщения экземпляра")}
        onScroll={onScroll}
        className={cn("logs", { "logs-expanded": isExpanded })}
      >
        {visible.length ? (
          visible.map((line, index) => <LogLine key={index} {...line} search={search} />)
        ) : (
          <p className="muted">
            {text
              ? t("Сообщений по этому запросу нет")
              : t("Пока нет записей. После запуска здесь появятся сообщения Hysteria2.")}
          </p>
        )}
      </div>
      <div className="log-footer" role="status">
        <span>{isFollowing ? t("Показываем новые сообщения") : t("Автопрокрутка на паузе")}</span>
        <span>{t("Показано {{visible}} из {{total}}", { visible: visible.length, total })}</span>
      </div>
    </section>
  );
}
