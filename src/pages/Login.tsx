import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, User } from "lucide-react";

const Login: React.FC = () => {
  const { login, token, authReady } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [authReady, token, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
      <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-white p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cash tracking
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your account to continue
          </p>
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
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-0 min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-3 pr-3 text-base text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
