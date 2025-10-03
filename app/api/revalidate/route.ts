// app/api/revalidate/route.ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST() {
  try {
    revalidateTag("public-tests");
    revalidateTag("public-marks");
    revalidateTag("public-students");
    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
