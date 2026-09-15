import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aiProvider: process.env.AI_PROVIDER ?? "없음",
    openAiKeyExists: !!process.env.OPENAI_API_KEY,
    openAiKeyLength: process.env.OPENAI_API_KEY?.length ?? 0,
  });
}
