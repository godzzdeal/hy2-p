import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export interface IDeployment {
  agentAvailable: boolean;
  agentBusy: boolean;
  container: boolean;
  httpChallenge: boolean;
  udpPublicPort: string;
  udpListenPort: string;
  publishedUdpPort: string;
  publishedUdpListenPort: string;
  udpRestartRequired: boolean;
  udpWarning: string;
}
export const deploymentApi = {
  read: (id?: string) => request<IDeployment>(instanceRoute(API_ROUTES.deployment, id)),
};
