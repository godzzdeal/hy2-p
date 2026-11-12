import { notFound } from "next/navigation";
import { AuthorizationReturn } from "@/components/admin/backups/authorization/AuthorizationReturn";

export const dynamic = "force-dynamic";
interface ICallbackPage {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ state?: string; code?: string; error?: string }>;
}
export default async function CallbackPage({ params, searchParams }: ICallbackPage) {
  const { provider } = await params;
  const query = await searchParams;
  try {
    if (
      !["yandex", "google", "dropbox", "onedrive"].includes(provider) ||
      !/^[a-f0-9]{48}$/.test(query.state ?? "") ||
      (query.code?.length ?? 0) > 4096
    )
      notFound();
    return (
      <AuthorizationReturn
        state={query.state ?? ""}
        code={query.code ?? ""}
        hasError={!!query.error || !query.code}
      />
    );
  } catch {
    notFound();
  }
}
