import { createClient } from "../../../lib/supabase/server";
import { getInviteInfo } from "../../../lib/workspace";
import { InviteAcceptPanel } from "./InviteAcceptPanel";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Supabase isn&apos;t configured yet</h1>
          <p className="auth-subtitle">This workspace can&apos;t accept invites until it is.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let invite: Awaited<ReturnType<typeof getInviteInfo>> = null;
  let loadError = "";

  try {
    invite = await getInviteInfo(supabase, token);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Something went wrong.";
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {invite ? (
          <>
            <h1 className="auth-title">Join {invite.workspaceName}</h1>
            <p className="auth-subtitle">
              {invite.status === "active"
                ? "This invite has already been accepted."
                : `You've been invited as ${invite.email}.`}
            </p>
            {invite.status === "invited" ? (
              <InviteAcceptPanel token={token} email={invite.email} isLoggedIn={Boolean(user)} />
            ) : null}
          </>
        ) : (
          <>
            <h1 className="auth-title">Invite not found</h1>
            <p className="auth-subtitle">
              {loadError || "This invite link is invalid or has expired."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
