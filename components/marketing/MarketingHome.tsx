import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MarketingCta, MarketingShell } from "./MarketingShell";
import { MARKETING_FEATURES } from "./marketingContent";

const STEPS = [
  {
    title: "Create your workspace",
    body: "Sign up and your workspace is ready with a starter set of board columns you can change.",
  },
  {
    title: "Invite your team",
    body: "Send an email invite or share a link. Teammates join with their own login.",
  },
  {
    title: "Track the work and the spend",
    body: "Run tasks and projects on the board, and keep every tool subscription in one list.",
  },
];

export function MarketingHome() {
  return (
    <MarketingShell>
      <section className="mk-hero">
        <div className="mk-container">
          <p className="mk-eyebrow">For agency teams</p>
          <h1 className="mk-h1">One workspace for your agency&apos;s work and its costs.</h1>
          <p className="mk-lede mk-lede-lg">
            Agency Board brings your kanban tasks, client projects, and tool subscriptions
            together, so you can see what is being built, who is on it, and what it costs.
          </p>
          <div className="mk-actions">
            <Link href="/signup" className="mk-btn mk-btn-primary mk-btn-lg">
              Create your workspace
            </Link>
            <Link href="/features" className="mk-btn mk-btn-ghost mk-btn-lg">
              See what&apos;s included
            </Link>
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="mk-features-title">
        <div className="mk-container">
          <h2 className="mk-h2" id="mk-features-title">
            Everything an agency tracks, in one place
          </h2>
          <div className="mk-grid">
            {MARKETING_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="mk-card" key={feature.id}>
                  <span className="mk-card-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <h3 className="mk-h3">{feature.title}</h3>
                  <p>{feature.summary}</p>
                </article>
              );
            })}
          </div>
          <p className="mk-more">
            <Link href="/features">Explore all features &rarr;</Link>
          </p>
        </div>
      </section>

      <section className="mk-section mk-section-alt" aria-labelledby="mk-steps-title">
        <div className="mk-container">
          <h2 className="mk-h2" id="mk-steps-title">
            Up and running in three steps
          </h2>
          <ol className="mk-steps">
            {STEPS.map((step, index) => (
              <li className="mk-step" key={step.title}>
                <span className="mk-step-number">{index + 1}</span>
                <h3 className="mk-h3">{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="mk-isolation-title">
        <div className="mk-container mk-callout">
          <span className="mk-card-icon" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="mk-h3" id="mk-isolation-title">
              Your data stays in your workspace
            </h2>
            <p>
              Every workspace is isolated at the database level, so one agency can never see
              another&apos;s tasks, projects, files, or spend.
            </p>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Bring your agency into one workspace"
        body="Create a workspace in a minute and invite your team when you're ready."
      />
    </MarketingShell>
  );
}
