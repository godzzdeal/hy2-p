import { type IUser } from "./model";
export type TUserDialog =
  { type: "create" } | { type: "edit" | "share" | "delete" | "traffic"; user: IUser } | null;
