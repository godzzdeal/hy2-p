import { API_ROUTES } from "@/config/network";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { DEMO } from "@/services/demo/data";
import { demoId, demoInput, demoState } from "@/services/demo/state";
import { ApiError } from "@/services/http/ApiError";
import { type IRequest } from "@/services/http/client";
import { DEFAULT_INSTANCE, MAX_INSTANCES } from "@/services/instances/types";
export function demoInstances(path: string, { method = "GET", body }: IRequest): unknown {
  if (path === API_ROUTES.instances) {
    if (method === "GET") return demoState.instances;
    if (demoState.instances.length >= MAX_INSTANCES) throw new ApiError("Достигнут предел: 8 ядер", 400);
    const input = demoInput<{ name: string; settings: IConfiguration }>(body);
    const id = demoId();
    const port = input.settings.port;
    const slot = Array.from({ length: MAX_INSTANCES }, (_value, index) => index).find(
      (index) => !demoState.instances.some((item) => item.slot === index),
    )!;
    demoState.settings[id] = input.settings;
    demoState.instances.push({
      id,
      name: input.name,
      slot,
      running: false,
      updating: false,
      version: DEMO.coreVersion,
      host: input.settings.host,
      port,
      publishedPort: port,
      listenPort: port,
      portChangeRequired: false,
      authMode: "panel",
    });
    return { id };
  }
  const instance = demoState.instances.find((item) => path === API_ROUTES.instance(item.id));
  if (!instance) return undefined;
  if (method === "PATCH") instance.name = demoInput<{ name: string }>(body).name;
  if (method === "DELETE") {
    if (instance.id === DEFAULT_INSTANCE) throw new ApiError("Основное ядро нельзя удалить", 400);
    demoState.instances = demoState.instances.filter((item) => item.id !== instance.id);
    delete demoState.settings[instance.id];
    delete demoState.logs[instance.id];
    delete demoState.history[instance.id];
    return { removed: true, operation: null };
  }
  return { ok: true };
}
