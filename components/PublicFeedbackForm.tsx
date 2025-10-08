"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Star } from "lucide-react";

export default function PublicFeedbackForm({ compact = true }: { compact?: boolean }) {
  const [parent, setParent] = useState("");
  const [student, setStudent] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!comment.trim()) {
      setBanner({ type: "err", msg: "Please write a short comment." });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: parent.trim() || null,
          student_name: student.trim() || null,
          comment: comment.trim(),
          rating: rating ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submission failed.");

      setParent("");
      setStudent("");
      setComment("");
      setRating(null);
      setBanner({ type: "ok", msg: "✅ Feedback received, thank you!" });
    } catch (err: any) {
      setBanner({ type: "err", msg: err?.message || "Failed to submit." });
    } finally {
      setBusy(false);
      setTimeout(() => setBanner(null), 3000);
    }
  }

  // Slightly smaller sizes to fit the vertical card but still comfortable
  const inputH = compact ? "h-9" : "h-10";
  const textSize = compact ? "text-[14px]" : "text-[15px]";
  const starSize = compact ? 20 : 22;
  const btnH = compact ? "h-9" : "h-10";
  const rows = compact ? 3 : 4;

  return (
    <form
      onSubmit={submit}
      className={`bg-white rounded-lg border border-zinc-200 shadow-sm w-full ${
        compact ? "p-2.5 space-y-2.5" : "p-4 space-y-3.5"
      }`}
    >
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`rounded-md px-3 py-2 text-sm text-center ${
              banner.type === "ok"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {banner.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parent & Student two columns (compact) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-700">Parent</label>
          <input
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            placeholder="Your name"
            className={`mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 ${inputH} ${textSize} outline-none focus:ring-1 focus:ring-emerald-300`}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-700">Student</label>
          <input
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            placeholder="Student name"
            className={`mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 ${inputH} ${textSize} outline-none focus:ring-1 focus:ring-emerald-300`}
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="text-xs text-zinc-700">Rating</label>
        <div className="mt-1 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const v = i + 1;
            const active = rating && rating >= v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                className="focus:outline-none"
                aria-label={`Rate ${v}`}
              >
                <Star
                  size={starSize}
                  className={`${active ? "text-amber-400 fill-amber-400" : "text-zinc-300"} transition`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs text-zinc-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Short feedback..."
          rows={rows}
          className={`mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 ${textSize} outline-none focus:ring-1 focus:ring-emerald-300 resize-none`}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition ${btnH} text-sm disabled:opacity-60`}
      >
        {busy ? "Submitting..." : (
          <>
            <SendHorizonal size={14} /> Submit
          </>
        )}
      </button>
    </form>
  );
}
