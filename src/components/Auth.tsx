import { useState } from "react";
import { supabase } from "../lib/supabase";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSent(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sentMessage =
    mode === "signup"
      ? `Confirmation link sent to ${email}`
      : `Password reset link sent to ${email}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-frost dark:bg-eggplant">
      <div className="w-full max-w-sm rounded-2xl border border-mauve bg-white p-8 dark:bg-mauve">
        {sent ? (
          <div className="text-center">
            <h2 className="mb-2 text-xl font-bold text-eggplant dark:text-frost">
              Check your email
            </h2>
            <p className="mb-4 text-sm text-mauve">{sentMessage}</p>
            <button
              type="button"
              onClick={() => reset("login")}
              className="text-sm font-semibold text-eggplant underline-offset-2 hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold text-eggplant dark:text-frost">
              Instelle
            </h1>
            <p className="mb-6 text-sm text-mauve">
              {mode === "login" && "Sign in to continue"}
              {mode === "signup" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-mauve bg-frost px-4 py-2.5 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
              />
              {mode !== "forgot" && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-mauve bg-frost px-4 py-2.5 text-sm text-eggplant outline-none focus:border-eggplant dark:bg-petal"
                />
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-mauve py-2.5 text-sm font-semibold text-eggplant transition-colors hover:bg-eggplant hover:text-frost disabled:cursor-not-allowed disabled:bg-blush disabled:text-eggplant"
              >
                {loading
                  ? "..."
                  : mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Sign up"
                      : "Send reset link"}
              </button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-1">
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={() => reset("forgot")}
                    className="text-xs text-mauve hover:text-eggplant"
                  >
                    Forgot password?
                  </button>
                  <p className="text-xs text-mauve">
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => reset("signup")}
                      className="font-semibold text-eggplant underline-offset-2 hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </>
              )}
              {(mode === "signup" || mode === "forgot") && (
                <p className="text-xs text-mauve">
                  <button
                    type="button"
                    onClick={() => reset("login")}
                    className="font-semibold text-eggplant underline-offset-2 hover:underline"
                  >
                    Back to sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
