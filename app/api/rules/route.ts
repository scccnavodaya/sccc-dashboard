import { NextResponse } from "next/server";

let RULES = ""; // ← Empty until admin updates

export async function GET() {
  return new NextResponse(RULES, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const text = await req.text();
  RULES = text;
  return new NextResponse("Updated");
}
