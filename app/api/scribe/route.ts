import { NextRequest, NextResponse } from "next/server";
import { admin, failure } from "@/lib/http";
import { transcribe } from "@/lib/elevenlabs";
export async function POST(req: NextRequest) {
  try {
    await admin(req);
    const file = (await req.formData()).get("file");
    if (
      !(file instanceof File) ||
      !file.type.startsWith("audio/") ||
      file.size > 20 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Upload an audio file smaller than 20 MB." },
        { status: 400 },
      );
    return NextResponse.json(await transcribe(file));
  } catch (e) {
    return failure(e);
  }
}
