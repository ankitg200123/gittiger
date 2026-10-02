/**
 * POST /api/revalidate — ISR on-demand revalidation.
 *
 * Called by run_daily.py after scoring so new rankings appear without a rebuild.
 * The secret is a shared random value in NEXT_REVALIDATE_TOKEN; the pipeline
 * reads it from /etc/gittiger/secrets.env.
 *
 *   POST /api/revalidate
 *   {"token": "...", "paths": ["/", "/rising"]}
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const DEFAULT_PATHS = ["/", "/rising", "/hidden-gems", "/topics", "/languages", "/insights"];

export async function POST(request: Request) {
  let body: { token?: string; paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const expected = process.env.NEXT_REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "server has no revalidation token configured" },
      { status: 503 },
    );
  }
  if (!body.token || body.token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const paths = body.paths?.length ? body.paths : DEFAULT_PATHS;
  const revalidated: string[] = [];
  const failed: Record<string, string> = {};

  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (e) {
      failed[p] = e instanceof Error ? e.message : "unknown";
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    failed,
    at: new Date().toISOString(),
  });
}
