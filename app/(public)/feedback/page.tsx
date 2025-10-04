"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function FeedbackPage() {
  const [parentName, setParentName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBanner(null);

    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: parentName.trim(),
          student_name: studentName.trim(),
          comment: comment.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to submit feedback.");

      setParentName("");
      setStudentName("");
      setComment("");
      setBanner({ ok: true, msg: "✅ Thank you! Your feedback has been submitted." });
    } catch (e: any) {
      setBanner({ ok: false, msg: e?.message || "❌ Could not submit feedback." });
    } finally {
      setBusy(false);
    }
  }

  // Auto-clear banner after 5s
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back to Dashboard */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Parent Feedback</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Please share your feedback. All fields are required.
      </p>

      {banner && (
        <div
          aria-live="polite"
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            banner.ok
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.msg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-4 rounded-2xl border bg-white p-4 shadow-sm"
      >
        <div className="mb-3">
          <label htmlFor="parentName" className="text-sm text-zinc-700">
            Parent Name
          </label>
          <input
            id="parentName"
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            placeholder="Enter your name"
            autoComplete="name"
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="studentName" className="text-sm text-zinc-700">
            Student Name
          </label>
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter the student's name"
            autoComplete="off"
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="text-sm text-zinc-700">
            Feedback
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your feedback here..."
            rows={6}
            maxLength={1000}
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="mt-1 text-xs text-zinc-500">
            {comment.length}/1000 characters
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
