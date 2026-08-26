"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Mail, Lock, Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@auto-ecole.tn"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 transition-colors disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Se connecter
      </button>
    </form>
  );
}
