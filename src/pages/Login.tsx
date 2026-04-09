import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

type AuthMode = "login" | "register";

const Login: React.FC = () => {
  const { login, register, token, authReady } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [authReady, token, navigate]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        if (password !== passwordConfirmation) {
          setError("Passwords do not match.");
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setSubmitting(false);
          return;
        }
        await register(
          username.trim(),
          email.trim(),
          password,
          passwordConfirmation
        );
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Loading…
      </div>
    );
  }

  if (token) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="login-auth-panel w-full max-w-md rounded-2xl border border-slate-700/80 bg-white p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Haven Cash tracking
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "login"
              ? "Sign in with your account to continue"
              : "Create an account with username, email, and password"}
          </p>
        </div>

        <div
          className="mb-6 flex rounded-lg bg-slate-100 p-1"
          role="tablist"
          aria-label="Sign in or register"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="login-username"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <div className="flex min-h-11 items-stretch divide-x divide-slate-200 overflow-hidden rounded-lg bg-slate-50 shadow-sm transition focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/25">
              <div className="flex shrink-0 items-center justify-center px-3.5">
                <User
                  className="pointer-events-none h-4 w-4 text-slate-500"
                  aria-hidden
                />
              </div>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-h-0 min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
                placeholder="admin"
              />
            </div>
          </div>

          {mode === "register" ? (
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="flex min-h-11 items-stretch divide-x divide-slate-200 overflow-hidden rounded-lg bg-slate-50 shadow-sm transition focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/25">
                <div className="flex shrink-0 items-center justify-center px-3.5">
                  <Mail
                    className="pointer-events-none h-4 w-4 text-slate-500"
                    aria-hidden
                  />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-0 min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="flex min-h-11 items-stretch divide-x divide-slate-200 overflow-hidden rounded-lg bg-slate-50 shadow-sm transition focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/25">
              <div className="flex shrink-0 items-center justify-center px-3.5">
                <Lock
                  className="pointer-events-none h-4 w-4 text-slate-500"
                  aria-hidden
                />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "register" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-0 min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex shrink-0 items-center justify-center px-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" aria-hidden />
                ) : (
                  <EyeOff className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {mode === "register" ? (
            <div>
              <label
                htmlFor="login-password-confirm"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <div className="flex min-h-11 items-stretch divide-x divide-slate-200 overflow-hidden rounded-lg bg-slate-50 shadow-sm transition focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/25">
                <div className="flex shrink-0 items-center justify-center px-3.5">
                  <Lock
                    className="pointer-events-none h-4 w-4 text-slate-500"
                    aria-hidden
                  />
                </div>
                <input
                  id="login-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="min-h-0 min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  className="flex shrink-0 items-center justify-center px-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  aria-label={
                    showPasswordConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showPasswordConfirm}
                >
                  {showPasswordConfirm ? (
                    <Eye className="h-4 w-4" aria-hidden />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
