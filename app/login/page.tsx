"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setIsSubmitting(false);
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <label className="form-field">
        <span className="form-label">Email</span>
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </label>

      <label className="form-field">
        <span className="form-label">Password</span>
        <input
          className="form-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to your Agency Board workspace.</p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="auth-switch">
          Don&apos;t have a workspace yet? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
