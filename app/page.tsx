import { Board } from "../components/Board";
import { MarketingHome } from "../components/marketing/MarketingHome";
import { createClient } from "../lib/supabase/server";
import { getBoardData, getCurrentWorkspace } from "../lib/workspace";

export default async function AgencyBoardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <MarketingHome />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <MarketingHome />;
  }

  const workspace = await getCurrentWorkspace(supabase);

  if (!workspace) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">No workspace found</h1>
          <p className="auth-subtitle">
            Your account isn&apos;t linked to a workspace yet. Try signing out and creating a new
            workspace, or ask a workspace owner to invite you.
          </p>
        </div>
      </main>
    );
  }

  const boardData = await getBoardData(supabase, workspace.id);

  return (
    <Board
      workspace={workspace}
      initialColumns={boardData.columns}
      initialMembers={boardData.members}
      initialTasks={boardData.tasks}
      initialProjects={boardData.projects}
      initialResourceTotals={boardData.resourceTotals}
      initialWorkspaceResources={boardData.workspaceResources}
      initialActivityLog={boardData.activityLog}
    />
  );
}
