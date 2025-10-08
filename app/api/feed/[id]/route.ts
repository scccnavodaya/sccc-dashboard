// app/api/mock/feeds/[id]/route.ts
import { NextResponse } from "next/server";

let FEEDS: any[] = [
  // sample
  { id: 1, section: "rules", content: "Sample rule", title: null },
  { id: 2, section: "gk", content: "Sample GK", title: null },
];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const feed = FEEDS.find((f) => f.id === id);
  if (!feed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(feed);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  let body = {};
  try {
    body = await req.json();
  } catch {}
  const idx = FEEDS.findIndex((f) => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  FEEDS[idx] = { ...FEEDS[idx], ...body };
  return NextResponse.json(FEEDS[idx]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const idx = FEEDS.findIndex((f) => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const removed = FEEDS.splice(idx, 1)[0];
  return NextResponse.json(removed);
}
