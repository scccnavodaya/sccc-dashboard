"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { passwordStrengthLabel, passwordStrengthScore } from "./strength";

export default function ResetByUsername({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !newPw.trim() || newPw !== confirmPw) return;
    if (passwordStrengthScore(newPw) < 3) return;
    setLoading(true);
    try {
      // TODO: call real /api/admin/reset (by username)
      await new Promise((r) => setTimeout(r, 700));
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSuccess();
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  const score = passwordStrengthScore(newPw);
  const label = passwordStrengthLabel(score);

  return (
    <form onSubmit={submit} className="space-y-4 sm:space-y-5 w-full max-w-md mx-auto px-4 sm:px-0">
      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-600">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          name="username"
        />
      </div>

      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-600">New Password</label>
        <div className="mt-1 flex items-stretch">
          <input
            type={show ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            className="w-full rounded-l-md border border-zinc-300 bg-white px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Enter new password"
            autoComplete="new-password"
            name="new-password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-3 sm:px-3.5 text-zinc-700 hover:bg-zinc-100 min-w-[44px]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* strength meter — only show after typing */}
        {newPw.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 w-full rounded bg-zinc-200 overflow-hidden">
              <div
                className={`h-1 rounded transition-all ${
                  score >= 4
                    ? "bg-emerald-600 w-full"
                    : score === 3
                    ? "bg-yellow-500 w-3/4"
                    : score === 2
                    ? "bg-orange-500 w-1/2"
                    : score === 1
                    ? "bg-red-500 w-1/4"
                    : "bg-red-400 w-1/6"
                }`}
              />
            </div>
            <span className="text-xs sm:text-[13px] text-zinc-600">{label}</span>
          </div>
        )}
        <p className="mt-1 text-xs sm:text-[13px] text-zinc-500">
          Min 8 chars, 1 uppercase, 1 number, 1 special.
        </p>
      </div>

      <div>
        <label className="text-sm sm:text-[0.95rem] text-zinc-600">Confirm Password</label>
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Confirm new password"
          autoComplete="new-password"
          name="new-password-confirm"
        />
        {confirmPw.length > 0 && confirmPw !== newPw && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-md border border-zinc-200 px-4 text-sm sm:text-[0.95rem] text-zinc-700 hover:bg-zinc-50 w-full sm:w-auto"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading || passwordStrengthScore(newPw) < 3 || newPw !== confirmPw}
          className="h-11 rounded-md bg-emerald-600 px-5 text-sm sm:text-[0.95rem] font-medium text-white hover:bg-emerald-700 disabled:opacity-60 w-full sm:w-auto"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {done && (
        <div className="mt-3 flex items-center gap-2 text-sm sm:text-[0.95rem] text-emerald-700">
          <CheckCircle2 size={16} /> Password updated successfully
        </div>
      )}
    </form>
  );
}
