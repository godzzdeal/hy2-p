import { S3Fields } from "@/components/admin/backups/form/credentials/S3Fields";
import { WebDavFields } from "@/components/admin/backups/form/credentials/WebDavFields";
import { RcloneFields } from "@/components/admin/backups/form/credentials/RcloneFields";
import { type useStorageForm } from "@/hooks/admin/storage";

export interface IStorageCredentials {
  model: ReturnType<typeof useStorageForm>;
}
export function StorageCredentials({ model }: IStorageCredentials) {
  switch (model.provider) {
    case "s3":
      return <S3Fields model={model} />;
    case "webdav":
      return <WebDavFields model={model} />;
    case "rclone":
      return <RcloneFields model={model} />;
    default:
      return null;
  }
}
