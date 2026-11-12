import type { TStorageProvider } from "@/services/admin/storage";

interface IProviderGuide {
  consoleName: string;
  consoleURL: string;
  documentationURL: string;
  steps: readonly string[];
}

export const PROVIDER_GUIDES: Partial<Record<TStorageProvider, IProviderGuide>> = {
  yandex: {
    consoleName: "Яндекс OAuth",
    consoleURL: "https://oauth.yandex.ru/",
    documentationURL: "https://yandex.ru/dev/id/doc/ru/register-auth",
    steps: [
      "Создайте приложение «Для авторизации пользователей» и выберите платформу «Веб-сервисы».",
      "В Redirect URI вставьте адрес возврата из панели.",
      "Добавьте право cloud_api:disk.app_folder.",
      "Откройте созданное приложение и скопируйте Client ID и Client Secret.",
      "У типа «Для доступа к API» нельзя менять Redirect URI, поэтому он не подходит.",
    ],
  },
  google: {
    consoleName: "Google Cloud",
    consoleURL: "https://console.cloud.google.com/auth/clients",
    documentationURL: "https://developers.google.com/identity/protocols/oauth2/web-server",
    steps: [
      "Выберите проект в Google Cloud и включите Google Drive API.",
      "Настройте Google Auth Platform и создайте OAuth-клиент типа Web application.",
      "В Authorized redirect URIs вставьте адрес возврата из панели.",
      "Скопируйте Client ID и Client Secret. Сохраните секрет сразу: позже Google его не покажет.",
      "Если приложение в режиме Testing, добавьте свой аккаунт в Test users. Для постоянных бэкапов настройте публикацию приложения.",
    ],
  },
  dropbox: {
    consoleName: "Dropbox App Console",
    consoleURL: "https://www.dropbox.com/developers/apps",
    documentationURL: "https://www.dropbox.com/developers/reference/getting-started",
    steps: [
      "Создайте Scoped access-приложение с доступом App folder.",
      "В Settings → OAuth 2 → Redirect URIs вставьте адрес возврата из панели.",
      "В Permissions включите files.content.write, files.content.read и files.metadata.read, затем сохраните изменения.",
      "В Settings скопируйте App key в Client ID, а App secret в Client Secret.",
    ],
  },
  onedrive: {
    consoleName: "Microsoft Entra",
    consoleURL: "https://entra.microsoft.com/",
    documentationURL: "https://learn.microsoft.com/en-us/graph/auth-register-app-v2",
    steps: [
      "Откройте App registrations и зарегистрируйте приложение для нужных типов аккаунтов.",
      "В Authentication добавьте платформу Web и адрес возврата из панели.",
      "Скопируйте Application (client) ID из Overview в поле Client ID.",
      "В Certificates & secrets создайте Client secret. Вставьте его Value в Client Secret, не Secret ID. Значение показывается только при создании.",
      "В API permissions добавьте делегированные разрешения Microsoft Graph Files.ReadWrite и offline_access.",
    ],
  },
};
