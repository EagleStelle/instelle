import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-frost dark:bg-[#1e1428]">
      <div className="w-full max-w-sm rounded-2xl border border-mauve/20 bg-white p-8 dark:bg-[#2d2238]">
        <h1 className="mb-1 text-2xl font-bold text-eggplant dark:text-frost">Set new password</h1>
        <p className="mb-6 text-sm text-mauve">Choose a strong password.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-mauve/30 bg-frost px-4 py-2.5 text-sm text-eggplant outline-none focus:border-mauve dark:border-mauve/20 dark:bg-eggplant dark:text-frost"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full rounded-xl border border-mauve/30 bg-frost px-4 py-2.5 text-sm text-eggplant outline-none focus:border-mauve dark:border-mauve/20 dark:bg-eggplant dark:text-frost"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-mauve py-2.5 text-sm font-semibold text-frost transition-colors hover:bg-eggplant disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
