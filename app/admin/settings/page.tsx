"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { passwordStrengthLabel, passwordStrengthScore } from "@/components/auth/strength";

const PASSWORD_RX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

export default function SettingsPage() {
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return router.push("/");
        const data = await res.json();
        const u = data?.user?.username ?? data?.user?.sub ?? "";
        setCurrentUsername(String(u));
      } catch {}
    })();
  }, [router]);

  const score = passwordStrengthScore(newPassword);
  const label = newPassword ? passwordStrengthLabel(score) : "—";

  // Enable submit only if something valid changed
  const canSubmit = useMemo(() => {
    if (!currentPassword) return false;
    const usernameChanged = !!username && username !== currentUsername;
    const passwordChanged =
      !!newPassword &&
      PASSWORD_RX.test(newPassword) &&
      newPassword === confirm;
    return usernameChanged || passwordChanged;
  }, [currentPassword, username, currentUsername, newPassword, confirm]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!currentPassword) return setErr("Enter current password.");
    if (!username && !newPassword)
      return setErr("Change username and/or new password.");
    if (newPassword) {
      if (!PASSWORD_RX.test(newPassword))
        return setErr(
          "Password must be 8–64 chars with 1 uppercase, 1 lowercase, 1 number, 1 special."
        );
      if (newPassword !== confirm)
        return setErr("New password and confirm do not match.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username || undefined,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      if (res.status === 401) {
        setErr("Session expired. Please log in again.");
        return router.push("/");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(data?.error || "Update failed.");

      setMsg("Credentials updated.");
      if (username) setCurrentUsername(username);
      setUsername("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-2 md:px-0">
      {/* Back to Dashboard */}
      <div className="mb-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <h2 className="text-lg font-semibold">Change credentials</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Update your admin username and/or password.{" "}
        <b>Current password</b> is always required. Passwords must follow the
        rule below.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        {/* Username */}
        <div>
          <label className="text-sm text-zinc-600">New username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder={
              currentUsername
                ? `Current: ${currentUsername}`
                : "Enter new username"
            }
            autoComplete="username"
          />
        </div>

        {/* Current password */}
        <div>
          <label className="text-sm text-zinc-600">Current password</label>
          <div className="mt-1 flex items-stretch">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-l-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Enter current password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-3 text-zinc-600 hover:bg-zinc-100"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="text-sm text-zinc-600">New password</label>
          <div className="mt-1 flex items-stretch">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-l-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Enter new password"
              autoComplete="new-password"
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}"
              title="8–64 chars with 1 uppercase, 1 lowercase, 1 number, 1 special."
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-3 text-zinc-600 hover:bg-zinc-100"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength meter */}
          {newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 w-full rounded bg-zinc-200">
                <div
                  className={`h-1 rounded ${
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
              <span className="text-xs text-zinc-600">{label}</span>
            </div>
          )}

          {/* Rules helper */}
          <ul className="mt-2 list-disc pl-5 text-xs text-zinc-500">
            <li>8–64 characters</li>
            <li>
              At least 1 uppercase, 1 lowercase, 1 number, 1 special character
            </li>
          </ul>

          {/* Confirm (only when changing password) */}
          {newPassword && (
            <div className="mt-3">
              <label className="text-sm text-zinc-600">
                Confirm new password
              </label>
              <div className="mt-1 flex items-stretch">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-l-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-3 text-zinc-600 hover:bg-zinc-100"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
