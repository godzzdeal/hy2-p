export interface IUser {
  id: string;
  name: string;
  enabled: boolean;
  expires: string;
  created: string;
}
export interface IUserInput {
  password?: string;
  name: string;
  expires: string;
}
export interface IUserUpdate extends IUserInput {
  enabled: boolean;
}
export interface IConnectionLinks {
  uri: string;
  subscription: string;
}
export function isUserActive(user: IUser): boolean {
  return user.enabled && (!user.expires || new Date(user.expires).getTime() > Date.now());
}
