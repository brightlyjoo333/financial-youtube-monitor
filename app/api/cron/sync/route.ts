import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const syncSecret = process.env.SYNC_SECRET;

  if (!syncSecret) {
    return NextResponse.json(
      { error: "SYNC_SECRET is not configured" },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;

  const response = await fetch(
    `${origin}/api/sync?secret=${encodeURIComponent(syncSecret)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ??
        "application/json",
    },
  });
}
