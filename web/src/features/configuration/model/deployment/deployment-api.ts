import { instanceRoute } from "@/features/instances/model";
import { request, API_ROUTES } from "@/shared/http";
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
