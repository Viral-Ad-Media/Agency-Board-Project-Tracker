"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";
import { bootstrapWorkspace } from "../../lib/workspace";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (signUpError) {
      setIsSubmitting(false);
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setIsSubmitting(false);
      setNeedsConfirmation(true);
      return;
    }

    try {
      await bootstrapWorkspace(supabase, workspaceName.trim() || "My Agency");
      router.push("/");
      router.refresh();
    } catch (bootstrapError) {
      setIsSubmitting(false);
      setError(
        bootstrapError instanceof Error ? bootstrapError.message : "Something went wrong.",
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your workspace</h1>
        <p className="auth-subtitle">Set up a new Agency Board workspace for your team.</p>

        {needsConfirmation ? (
          <p className="auth-notice">
            Check <strong>{email}</strong> for a confirmation link to finish setting up your
            workspace.
          </p>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <label className="form-field">
              <span className="form-label">Your Name</span>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="form-field">
              <span className="form-label">Workspace Name</span>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Acme Agency"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span className="form-label">Password</span>
              <input
                className="form-input"
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="form-actions">
              <button className="btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating workspace..." : "Create Workspace"}
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch">
          Already have a workspace? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
