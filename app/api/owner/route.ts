import { NextRequest, NextResponse } from "next/server";
import { admin, failure } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    await admin(req);
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
