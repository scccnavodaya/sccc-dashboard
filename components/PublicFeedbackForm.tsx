"use client";

import { useState } from "react";

export default function PublicFeedbackForm() {
  const [parent, setParent] = useState("");
  const [student, setStudent] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setBusy(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: parent.trim(),
          student_name: student.trim(),
          comment: comment.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to submit feedback");

      setParent("");
      setStudent("");
      setComment("");
      setBanner({ type: "ok", msg: "Thank you! Your feedback was submitted." });
    } catch (e: any) {
      setBanner({ type: "err", msg: e?.message || "Failed to submit." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        rounded-2xl border bg-white
        w-full max-w-md mx-auto
        p-4 sm:p-5
        space-y-3 sm:space-y-4
      "
    >
      {banner && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            banner.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.msg}
        </div>
      )}

      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-700">Parent Name</label>
        <input
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          placeholder="Enter your name"
          className="
            mt-1 w-full rounded border border-zinc-300 bg-white
            px-3 h-11 text-[15px]
            outline-none focus:ring-2 focus:ring-emerald-300
          "
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-700">Student Name</label>
        <input
          value={student}
          onChange={(e) => setStudent(e.target.value)}
          placeholder="Enter the student's name"
          className="
            mt-1 w-full rounded border border-zinc-300 bg-white
            px-3 h-11 text-[15px]
            outline-none focus:ring-2 focus:ring-emerald-300
          "
          autoComplete="off"
          required
        />
      </div>

      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your feedback here..."
          rows={6}
          className="
            mt-1 w-full rounded border border-zinc-300 bg-white
            px-3 py-2 text-[15px]
            outline-none focus:ring-2 focus:ring-emerald-300
            resize-y
          "
          required
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="
          h-11 rounded bg-emerald-600 px-4
          text-sm sm:text-[0.95rem] font-medium text-white
          hover:bg-emerald-700 disabled:opacity-60
          w-full sm:w-auto
        "
      >
        {busy ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
