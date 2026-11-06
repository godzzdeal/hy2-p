export const AccessMode = { All: "all", Selected: "selected" } as const;
export interface IUserAccess {
  mode: (typeof AccessMode)[keyof typeof AccessMode];
  instances: string[];
}
