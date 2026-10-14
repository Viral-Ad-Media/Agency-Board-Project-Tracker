"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";
import { acceptInvite } from "../../../lib/workspace";

type InviteAcceptPanelProps = {
  token: string;
  email: string;
  isLoggedIn: boolean;
};

export function InviteAcceptPanel({ token, email, isLoggedIn }: InviteAcceptPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function finishAccept() {
    const supabase = createClient();
    await acceptInvite(supabase, token);
    router.push("/");
    router.refresh();
  }

  async function handleAcceptAsIs() {
    setError("");
    setIsSubmitting(true);
    try {
      await finishAccept();
    } catch (acceptError) {
      setIsSubmitting(false);
      setError(acceptError instanceof Error ? acceptError.message : "Something went wrong.");
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setIsSubmitting(false);
        setError(signInError.message);
        return;
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/invite/${token}`,
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
    }

    try {
      await finishAccept();
    } catch (acceptError) {
      setIsSubmitting(false);
      setError(acceptError instanceof Error ? acceptError.message : "Something went wrong.");
    }
  }

  if (isLoggedIn) {
    return (
      <div className="form-actions">
        <button
          className="btn-primary"
          type="button"
          onClick={handleAcceptAsIs}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Joining..." : "Accept Invite"}
        </button>
        {error ? <p className="auth-error">{error}</p> : null}
      </div>
    );
  }

  if (needsConfirmation) {
    return (
      <p className="auth-notice">
        Check <strong>{email}</strong> for a confirmation link to join the workspace.
      </p>
    );
  }

  return (
    <>
      <div className="auth-mode-toggle">
        <button
          type="button"
          className={`auth-mode-btn${mode === "login" ? " active" : ""}`}
          onClick={() => setMode("login")}
        >
          Log In
        </button>
        <button
          type="button"
          className={`auth-mode-btn${mode === "signup" ? " active" : ""}`}
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      <form className="form-grid" onSubmit={handleAuthSubmit} noValidate>
        {mode === "signup" ? (
          <label className="form-field">
            <span className="form-label">Your Name</span>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="form-field">
          <span className="form-label">Email</span>
          <input className="form-input" type="email" defaultValue={email} disabled />
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
            autoFocus
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Log In & Join"
                : "Create Account & Join"}
          </button>
        </div>
      </form>
    </>
  );
}
