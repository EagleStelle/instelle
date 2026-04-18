import { useState } from "react";
import { LuCheck, LuKeyRound, LuX } from "react-icons/lu";
import { supabase } from "../lib/supabase";

interface SettingsPasswordModalProps {
  onClose: () => void;
}

export default function SettingsPasswordModal({
  onClose,
}: SettingsPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user?.email) {
        throw new Error("Could not verify current account email.");
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-eggplant/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-mauve bg-frost p-6 dark:bg-mauve"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-eggplant dark:text-frost">
          Change password
        </h3>
        <p className="mb-4 text-sm text-mauve dark:text-petal">
          Confirm your current password before setting a new one.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-mauve bg-white px-4 py-2.5 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-mauve bg-white px-4 py-2.5 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-mauve bg-white px-4 py-2.5 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
          />

          {error && (
            <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-700 dark:text-green-300">
              {success}
            </p>
          )}

          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-mauve py-2 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost disabled:cursor-not-allowed disabled:bg-blush disabled:text-eggplant"
            >
              <LuCheck size={14} />
              <span>{loading ? "Updating..." : "Update password"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mauve px-3 py-2 text-sm font-medium text-eggplant transition-colors hover:bg-petal dark:text-frost dark:hover:bg-blush"
            >
              <LuX size={14} />
              <span>Close</span>
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-mauve dark:text-petal">
          <LuKeyRound size={12} />
          <span>For security, your current password is required.</span>
        </div>
      </div>
    </div>
  );
}
