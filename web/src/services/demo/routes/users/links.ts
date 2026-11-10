import { type IConnectionLinks, type IUser } from "@/services/users/user-types";
import { demoState } from "@/services/demo/state";
import { withDefaultFlag } from "@/utils/flags/flag-options";
export function demoLinks(user: IUser): IConnectionLinks {
  const access = demoState.access[user.id];
  const connections = demoState.instances
    .filter((instance) => access?.mode !== "selected" || access.instances.includes(instance.id))
    .map((instance) => ({
      instanceId: instance.id,
      name: instance.name,
      uri:
        "hy2://demo-not-a-real-password@vpn.example.invalid:" +
        instance.port +
        "/?sni=vpn.example.invalid" +
        (demoState.settings[instance.id]?.pinFromCertificate || demoState.settings[instance.id]?.pinSHA256
          ? "&pinSHA256=" +
            (demoState.settings[instance.id]?.pinFromCertificate
              ? "ab".repeat(32)
              : encodeURIComponent(demoState.settings[instance.id]?.pinSHA256 ?? ""))
          : "") +
        "#" +
        encodeURIComponent(withDefaultFlag(user.name, demoState.announcement.defaultUserFlag ?? "")),
    }));
  return {
    uri: connections[0]?.uri ?? "",
    connections,
    subscription: "https://vpn.example.invalid/sub/demo-" + user.id,
    deviceLimit: demoState.devices[user.id]?.limit ?? 0,
  };
}
