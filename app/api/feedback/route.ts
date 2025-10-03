// app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

type Feedback = {
  id: string;
  parent_name: string;
  student_name: string;
  comment: string;
  read: boolean;
  created_at: string;
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []) as Feedback[]);
}

export async function POST(req: Request) {
  // Parse JSON or FormData bodies safely
  let parent_name = "";
  let student_name = "";
  let comment = "";

  try {
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const body = (await req.json()) as Partial<Feedback> & Record<string, unknown>;
      parent_name = String(body?.parent_name ?? "").trim();
      student_name = String(body?.student_name ?? "").trim();
      comment = String(body?.comment ?? "").trim();
    } else if (ctype.includes("multipart/form-data")) {
      const fd = await req.formData();
      parent_name = String(fd.get("parent_name") ?? "").trim();
      student_name = String(fd.get("student_name") ?? "").trim();
      comment = String(fd.get("comment") ?? "").trim();
    } else {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      parent_name = String(body?.parent_name ?? "").trim();
      student_name = String(body?.student_name ?? "").trim();
      comment = String(body?.comment ?? "").trim();
    }
  } catch {
    // leave defaults as ""
  }

  // Friendly validation
  const fieldErrors: Record<"parent_name" | "student_name" | "comment", string> = {} as any;
  if (parent_name.length < 2) fieldErrors.parent_name = "Parent name must be at least 2 characters.";
  if (student_name.length < 2) fieldErrors.student_name = "Student name must be at least 2 characters.";
  if (comment.length < 3) fieldErrors.comment = "Comment must be at least 3 characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert({ parent_name, student_name, comment })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Feedback, { status: 201 });
}
