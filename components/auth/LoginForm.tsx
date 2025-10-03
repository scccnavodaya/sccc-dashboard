// components/auth/LoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { passwordStrengthLabel, passwordStrengthScore } from "./strength";

export default function LoginForm({
  onSuccess,
  onForgot,
}: { onSuccess?: () => void; onForgot: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!username || !password) { setErr("Enter username and password"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error || "Login failed"); return; }

      onSuccess?.();
      const next = searchParams.get("next");
      router.push(next || "/admin");
    } catch (e: any) {
      setErr(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const hasTyped = password.length > 0;
  const score = hasTyped ? passwordStrengthScore(password) : 0;
  const label = hasTyped ? passwordStrengthLabel(score) : "";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-600">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Enter username"
          autoComplete="username"
        />
      </div>

      <div>
        <label className="text-sm text-zinc-600">Password</label>
        <div className="mt-1 flex items-stretch">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-l-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Enter password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-3 text-zinc-600 hover:bg-zinc-100"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Strength meter: only show AFTER typing */}
        {hasTyped && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 w-full rounded bg-zinc-200">
              <div
                className={`h-1 rounded ${
                  score >= 4
                    ? "w-full bg-emerald-600"
                    : score === 3
                    ? "w-3/4 bg-yellow-500"
                    : score === 2
                    ? "w-1/2 bg-orange-500"
                    : "w-1/4 bg-red-500"
                }`}
              />
            </div>
            <span className="text-xs text-zinc-600">{label}</span>
          </div>
        )}

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
        <button
          type="button"
          onClick={onForgot}
          className="text-sm text-emerald-700 hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}
