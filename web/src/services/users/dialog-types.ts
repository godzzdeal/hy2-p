import { type IUser } from "@/services/users/user-types";
export type TUserDialog =
  | { type: "create" }
  | { type: "edit" | "share" | "delete" | "traffic" | "access" | "devices"; user: IUser }
  | null;
