import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "../../components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Pricing | Agency Board",
  description: "Agency Board is in early access. There is no billing yet.",
};

const INCLUDED = [
  "Kanban board with editable columns",
  "Projects with requirements, features, and costed resources",
  "Subscription and tool-spend tracking",
  "Team invites with individual logins",
  "Activity feed and live sync",
  "File attachments on tasks",
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mk-hero mk-hero-compact">
        <div className="mk-container">
          <p className="mk-eyebrow">Pricing</p>
          <h1 className="mk-h1">Early access</h1>
          <p className="mk-lede mk-lede-lg">
            Agency Board doesn&apos;t charge anything yet. Paid plans haven&apos;t been announced,
            and we&apos;ll tell you before anything changes.
          </p>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container mk-pricing-wrap">
          <article className="mk-card mk-pricing-card">
            <h2 className="mk-h3">Everything, for now</h2>
            <p className="mk-pricing-note">No billing during early access.</p>
            <ul className="mk-checklist">
              {INCLUDED.map((item) => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mk-btn mk-btn-primary mk-btn-block">
              Create your workspace
            </Link>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
