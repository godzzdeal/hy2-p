import { request, API_ROUTES } from "@/shared/http";
export interface IDeployment {
  container: boolean;
  httpChallenge: boolean;
  udpPublicPort: string;
  udpListenPort: string;
  publishedUdpPort: string;
  publishedUdpListenPort: string;
  udpRestartRequired: boolean;
  udpWarning: string;
}
export const deploymentApi = { read: () => request<IDeployment>(API_ROUTES.deployment) };
