import { type IUser } from "./model";
export type TUserDialog =
  | { type: "create" }
  | { type: "edit" | "share" | "delete" | "traffic" | "access" | "devices"; user: IUser }
  | null;
