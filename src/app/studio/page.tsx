import { Suspense } from "react";

import { StudioShell } from "@/components/demo/StudioShell";

export default async function StudioPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const accessKey = process.env.STUDIO_ACCESS_KEY;
  const suppliedKey = Array.isArray(params.key) ? params.key[0] : params.key;
  const requiresAccessKey = Boolean(accessKey) || process.env.NEXT_PUBLIC_APP_ENV === "production";

  if (requiresAccessKey && (!accessKey || suppliedKey !== accessKey)) {
    return (
      <main className="grid min-h-screen place-items-center bg-qq-bg px-4">
        <section className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 text-center shadow-soft">
          <p className="text-sm font-bold uppercase text-blue-600">真实 LLM 工作台</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">需要访问密钥</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            无 LLM 评审模式可直接访问。真实 LLM 工作台用于 live route 调试和快照保存，需要在 URL 中带上 key。
          </p>
        </section>
      </main>
    );
  }

  return (
    <Suspense>
      <StudioShell />
    </Suspense>
  );
}
