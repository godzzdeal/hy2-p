import { API_ROUTES } from "@/config/network";
import { demoInput, demoState } from "@/services/demo/state";
import { type IRequest } from "@/services/http/client";
export function demoDevices(userId: string, path: string, { method = "GET", body }: IRequest): unknown {
  const devices = demoState.devices[userId] ?? { limit: 0, devices: [] };
  demoState.devices[userId] = devices;
  if (path === API_ROUTES.userDevices(userId)) {
    if (method === "PUT") devices.limit = demoInput<{ limit: number }>(body).limit;
    return devices;
  }
  const device = devices.devices.find((item) => path === API_ROUTES.userDevice(userId, item.id));
  if (!device) return undefined;
  if (method === "DELETE") devices.devices = devices.devices.filter((item) => item.id !== device.id);
  else if (method === "PATCH") device.blocked = demoInput<{ blocked: boolean }>(body).blocked;
  return devices;
}
