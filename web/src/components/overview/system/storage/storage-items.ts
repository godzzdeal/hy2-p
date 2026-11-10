import { type ISystemStorage } from "@/services/admin/maintenance";

export function storageItems(value: ISystemStorage) {
  return [
    { label: "Данные панели", bytes: value.data },
    { label: "Резервные копии", bytes: value.backups },
    { label: "Версии панели", bytes: value.releases },
    { label: "Остальные файлы", bytes: value.other },
    { label: "Образы Docker", bytes: value.images },
  ];
}
